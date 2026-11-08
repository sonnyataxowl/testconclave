import test from 'node:test';
import assert from 'node:assert/strict';
import { clearJwksCache, verifyToken } from '../../functions/_lib/jwt.js';

const API = 'https://api.axowl.com';
const ORG = 'acme';
const AUD = 'app_test';
const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

const pair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1' };

async function sign(claims, { kid = 'k1', alg = 'RS256' } = {}) {
  const head = enc({ alg, kid });
  const body = enc(claims);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${Buffer.from(sig).toString('base64url')}`;
}

const good = () => ({ iss: `${API}/api/public/orgs/${ORG}`, aud: AUD, sub: 'u1', exp: Math.floor(Date.now() / 1000) + 600 });
const fetchImpl = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
const opts = { apiBase: API, orgSlug: ORG, audience: AUD, fetchImpl };

test.beforeEach(() => clearJwksCache());

test('유효한 토큰은 클레임을 돌려준다', async () => {
  assert.equal((await verifyToken(await sign(good()), opts)).sub, 'u1');
});

test('만료·잘못된 iss·aud·알 수 없는 kid·alg 는 거부한다', async () => {
  assert.equal(await verifyToken(await sign({ ...good(), exp: 1 }), opts), null);
  assert.equal(await verifyToken(await sign({ ...good(), iss: 'https://evil' }), opts), null);
  assert.equal(await verifyToken(await sign({ ...good(), aud: 'other' }), opts), null);
  assert.equal(await verifyToken(await sign(good(), { kid: 'zz' }), opts), null);
  assert.equal(await verifyToken(await sign(good(), { alg: 'none' }), opts), null);
});

test('서명이 변조되면 거부한다', async () => {
  const [h, , s] = (await sign(good())).split('.');
  const forged = `${h}.${enc({ ...good(), sub: 'admin' })}.${s}`;
  assert.equal(await verifyToken(forged, opts), null);
});

test('설정이 비어 있으면 거부한다(fail closed)', async () => {
  assert.equal(await verifyToken(await sign(good()), { ...opts, orgSlug: undefined }), null);
  assert.equal(await verifyToken(null, opts), null);
});
