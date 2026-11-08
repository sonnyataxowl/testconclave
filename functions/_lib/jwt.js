// Axowl 최종 사용자 JWT(RS256) 검증. 서명 키는 조직 JWKS 에서 가져온다.
// iss 는 `${apiBase}/api/public/orgs/${orgSlug}`, aud 는 앱 키(문서: sdk/python.mdx).
const jwksCache = new Map();
const JWKS_TTL_MS = 10 * 60 * 1000;

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function decodeJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function loadJwks(url, fetchImpl, force) {
  const hit = jwksCache.get(url);
  if (!force && hit && Date.now() - hit.at < JWKS_TTL_MS) return hit.keys;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error('jwks');
  const { keys } = await res.json();
  jwksCache.set(url, { at: Date.now(), keys: keys ?? [] });
  return keys ?? [];
}

export function clearJwksCache() {
  jwksCache.clear();
}

/** 성공하면 클레임 객체를, 실패하면 null 을 돌려준다. */
export async function verifyToken(token, { apiBase, orgSlug, audience, fetchImpl = fetch, now = () => Date.now() }) {
  if (!token || !orgSlug || !audience) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson(parts[0]);
    const claims = decodeJson(parts[1]);
    if (header.alg !== 'RS256') return null;

    const issuer = `${apiBase}/api/public/orgs/${orgSlug}`;
    if (claims.iss !== issuer) return null;
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(audience)) return null;
    const nowSec = Math.floor(now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp <= nowSec) return null;
    if (typeof claims.nbf === 'number' && claims.nbf > nowSec) return null;
    if (typeof claims.sub !== 'string' || !claims.sub) return null;

    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    let keys = await loadJwks(jwksUrl, fetchImpl, false);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      keys = await loadJwks(jwksUrl, fetchImpl, true);
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return ok ? claims : null;
  } catch {
    return null;
  }
}

export function bearerToken(request) {
  const h = request.headers.get('Authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}
