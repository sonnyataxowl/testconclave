// 호스티드 로그인 후 돌아온 일회용 코드를 JWT 로 교환하고 보관한다.
// 엔드포인트 형식은 Axowl 담당자 답변(결정 기록)에 따른다.
const KEY = 'conclave.accessToken';

export async function exchange(apiBase, clientKey, code) {
    const res = await fetch(`${apiBase}/api/public/apps/${clientKey}/auth/session/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body || !body.accessToken) return null;
    sessionStorage.setItem(KEY, body.accessToken);
    return body.accessToken;
}

export function getToken() {
    return sessionStorage.getItem(KEY);
}

export function clearToken() {
    sessionStorage.removeItem(KEY);
}

export async function logout(apiBase, clientKey) {
    const token = sessionStorage.getItem(KEY);
    try {
        if (token) {
            await fetch(`${apiBase}/api/public/apps/${clientKey}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
        }
    } finally {
        sessionStorage.removeItem(KEY);
    }
}
