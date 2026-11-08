import postgres from 'postgres';
import { bearerToken, verifyToken } from './jwt.js';

const API_BASE = 'https://api.axowl.com';

// env: DATABASE_URL(시크릿), AXOWL_ORG_SLUG, AXOWL_APP_KEY(비밀 아님, Pages 변수)
export function makeDeps(env) {
  const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  const toDto = (r) => ({ id: r.id, title: r.title, status: r.status, createdAt: r.created_at });
  return {
    authenticate: (request) =>
      verifyToken(bearerToken(request), {
        apiBase: API_BASE, orgSlug: env.AXOWL_ORG_SLUG, audience: env.AXOWL_APP_KEY,
      }),
    listByOwner: async (sub) =>
      (await sql`select id, title, status, created_at from conclave_meeting
                 where owner_sub = ${sub} order by created_at desc limit 200`).map(toDto),
    insert: async ({ ownerSub, title }) =>
      toDto((await sql`insert into conclave_meeting (owner_sub, title) values (${ownerSub}, ${title})
                       returning id, title, status, created_at`)[0]),
  };
}
