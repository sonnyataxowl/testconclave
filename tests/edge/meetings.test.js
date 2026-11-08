import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCreate, handleList } from '../../functions/_lib/meetings.js';

function fakeDeps(claimsBySub) {
  const rows = [];
  return {
    rows,
    authenticate: async (req) => claimsBySub[req.headers.get('Authorization')] ?? null,
    listByOwner: async (sub) => rows.filter((r) => r.ownerSub === sub),
    insert: async ({ ownerSub, title }) => {
      const m = { id: String(rows.length + 1), ownerSub, title, status: 'scheduled' };
      rows.push(m);
      return m;
    },
  };
}

const req = (auth, body) =>
  new Request('https://x/api/meetings', {
    method: body === undefined ? 'GET' : 'POST',
    headers: auth ? { Authorization: auth } : {},
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

const deps = () => fakeDeps({ A: { sub: 'alice' }, B: { sub: 'bob' } });

test('토큰이 없으면 401', async () => {
  const d = deps();
  assert.equal((await handleList(req(null), d)).status, 401);
  assert.equal((await handleCreate(req(null, { title: 't' }), d)).status, 401);
});

test('로그인한 사용자가 만든 회의만 목록에 나타난다', async () => {
  const d = deps();
  assert.equal((await handleCreate(req('A', { title: '앨리스 회의' }), d)).status, 201);
  await handleCreate(req('B', { title: '밥 회의' }), d);
  const body = await (await handleList(req('A'), d)).json();
  assert.deepEqual(body.meetings.map((m) => m.title), ['앨리스 회의']);
});

test('본문의 ownerSub 는 무시하고 토큰의 sub 를 소유자로 쓴다', async () => {
  const d = deps();
  await handleCreate(req('A', { title: 't', ownerSub: 'bob' }), d);
  assert.equal(d.rows[0].ownerSub, 'alice');
});

test('제목이 비었거나 너무 길면 400, 깨진 JSON 도 400', async () => {
  const d = deps();
  assert.equal((await handleCreate(req('A', { title: '   ' }), d)).status, 400);
  assert.equal((await handleCreate(req('A', { title: 'x'.repeat(201) }), d)).status, 400);
  assert.equal((await handleCreate(req('A', '{oops'), d)).status, 400);
  assert.equal(d.rows.length, 0);
});
