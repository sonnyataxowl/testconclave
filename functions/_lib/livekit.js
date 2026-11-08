// LiveKit 접속 토큰 발급. 서명은 HS256(WebCrypto), 키·URL 은 Pages 환경값에서 읽는다.
// env: LIVEKIT_URL(변수), LIVEKIT_API_KEY / LIVEKIT_API_SECRET(시크릿)
export const TOKEN_TTL_SEC = 60 * 60;
const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_NAME = 60;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

export async function signLiveKitToken({ apiKey, apiSecret, identity, name, room, nowSec }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: apiKey,
    sub: identity,
    name,
    nbf: nowSec,
    exp: nowSec + TOKEN_TTL_SEC,
    video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true },
  };
  const input = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return `${input}.${b64url(new Uint8Array(sig))}`;
}

/**
 * deps: { authenticate(request) -> claims|null, config: {url, apiKey, apiSecret}, now(), randomId() }
 * 로그인한 사용자는 토큰의 sub 가 신원이고, 로그인 없이 링크로 들어온 참가자는 게스트 신원을 받는다.
 * 잘못된 토큰(만료 등)으로 온 요청은 게스트로 강등하지 않고 401 로 거절한다.
 */
export async function handleToken(request, deps) {
  const { url, apiKey, apiSecret } = deps.config;
  if (!url || !apiKey || !apiSecret) {
    return json({ error: 'livekit_not_configured', message: 'LiveKit 설정(LIVEKIT_URL/API_KEY/API_SECRET)이 아직 없습니다.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const room = typeof body?.room === 'string' ? body.room : '';
  if (!ROOM_RE.test(room)) return json({ error: 'invalid_room' }, 400);

  let identity;
  let name = typeof body?.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
  const hasAuth = (request.headers.get('Authorization') ?? '') !== '';
  if (hasAuth) {
    const claims = await deps.authenticate(request);
    if (!claims) return json({ error: 'unauthorized' }, 401);
    identity = claims.sub;
    name = name || claims.name || claims.email || '참가자';
  } else {
    identity = `guest-${deps.randomId()}`;
    name = name || '게스트';
  }

  const token = await signLiveKitToken({
    apiKey, apiSecret, identity, name, room, nowSec: Math.floor(deps.now() / 1000),
  });
  return json({ url, token, identity, name });
}
