// 회의 목록·생성 로직. DB 와 인증은 주입받아 단위 테스트가 가능하다.
export const MAX_TITLE = 200;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * deps: { authenticate(request) -> claims|null, listByOwner(sub), insert({ownerSub,title}) }
 * 소유자는 항상 검증된 토큰의 sub 이다. 요청 본문의 값은 쓰지 않는다.
 */
export async function handleList(request, deps) {
  const claims = await deps.authenticate(request);
  if (!claims) return json({ error: 'unauthorized' }, 401);
  const meetings = await deps.listByOwner(claims.sub);
  return json({ meetings });
}

export async function handleCreate(request, deps) {
  const claims = await deps.authenticate(request);
  if (!claims) return json({ error: 'unauthorized' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > MAX_TITLE) return json({ error: 'invalid_title' }, 400);

  const meeting = await deps.insert({ ownerSub: claims.sub, title });
  return json({ meeting }, 201);
}
