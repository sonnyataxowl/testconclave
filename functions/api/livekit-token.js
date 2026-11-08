import { handleToken } from '../_lib/livekit.js';
import { bearerToken, verifyToken } from '../_lib/jwt.js';

const API_BASE = 'https://api.axowl.com';

// 주의: ../_lib/jwt.js 는 회의 저장 API PR(#6)에 있다. #6 이 main 에 들어간 뒤 배포된다.
export const onRequestPost = ({ request, env }) =>
  handleToken(request, {
    config: { url: env.LIVEKIT_URL, apiKey: env.LIVEKIT_API_KEY, apiSecret: env.LIVEKIT_API_SECRET },
    authenticate: (req) =>
      verifyToken(bearerToken(req), {
        apiBase: API_BASE, orgSlug: env.AXOWL_ORG_SLUG, audience: env.AXOWL_APP_KEY,
      }),
    now: () => Date.now(),
    randomId: () => crypto.randomUUID(),
  });
