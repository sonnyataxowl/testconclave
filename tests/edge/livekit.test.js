import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleToken, signLiveKitToken, TOKEN_TTL_SEC } from '../../functions/_lib/livekit.js';

const config = { url: 'wss://example.test', apiKey: 'key1', apiSecret: 'secret1' };
const mkDeps = (over = {}) => ({
  config,
  authenticate: async (req) => (req.headers.get('Authorization') === 'Bearer ok' ? { sub: 'alice', name: 'Alice' } : null),
  now: () => 1_700_000_000_000,
  randomId: () => 'abc',
  ...over,
});
const req = (body, auth) =>
  new Request('https://x/api/livekit-token', {
    method: 'POST',
    headers: auth ? { Authorization: auth } : {},
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const claimsOf = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

test('설정이 없으면 503 과 이유를 돌려준다', async () => {
  const res = await handleToken(req({ room: 'r1' }), mkDeps({ config: { url: '', apiKey: '', apiSecret: '' } }));
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'livekit_not_configured');
});

test('로그인 사용자는 sub 가 신원이고 방 입장 권한이 담긴다', async () => {
  const res = await handleToken(req({ room: 'room-1' }, 'Bearer ok'), mkDeps());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.url, 'wss://example.test');
  const c = claimsOf(body.token);
  assert.equal(c.iss, 'key1');
  assert.equal(c.sub, 'alice');
  assert.equal(c.name, 'Alice');
  assert.equal(c.video.room, 'room-1');
  assert.equal(c.video.roomJoin, true);
  assert.equal(c.exp - c.nbf, TOKEN_TTL_SEC);
});

test('토큰 없이 온 참가자는 게스트 신원과 입력한 이름을 받는다', async () => {
  const body = await (await handleToken(req({ room: 'r1', name: '  민수 ' }), mkDeps())).json();
  const c = claimsOf(body.token);
  assert.equal(c.sub, 'guest-abc');
  assert.equal(c.name, '민수');
});

test('잘못된 토큰은 게스트로 강등하지 않고 401', async () => {
  const res = await handleToken(req({ room: 'r1' }, 'Bearer bad'), mkDeps());
  assert.equal(res.status, 401);
});

test('방 이름이 이상하거나 JSON 이 깨지면 400', async () => {
  assert.equal((await handleToken(req({ room: '../x' }), mkDeps())).status, 400);
  assert.equal((await handleToken(req({}), mkDeps())).status, 400);
  assert.equal((await handleToken(req('{oops'), mkDeps())).status, 400);
});

test('서명이 HS256 이고 비밀키로 검증된다', async () => {
  const token = await signLiveKitToken({ apiKey: 'k', apiSecret: 's', identity: 'i', name: 'n', room: 'r', nowSec: 1 });
  const [h, p, sig] = token.split('.');
  assert.equal(createHmac('sha256', 's').update(`${h}.${p}`).digest('base64url'), sig);
  assert.equal(JSON.parse(Buffer.from(h, 'base64url').toString()).alg, 'HS256');
});
