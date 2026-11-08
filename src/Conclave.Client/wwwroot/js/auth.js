// 호스티드 로그인 후 돌아온 일회용 코드를 JWT 로 교환하고 보관한다.
// 엔드포인트 형식은 Axowl 담당자 답변(결정 기록)에 따른다.
const KEY = 'conclave.accessToken';

// 항상 { token, error } 를 돌려준다. 실패 이유(HTTP 상태, 네트워크/CORS)를 화면에 보여주기 위해서다.
export async function exchange(apiBase, clientKey, code) {
    try {
        const res = await fetch(`${apiBase}/api/public/apps/${clientKey}/auth/session/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        if (!res.ok) return { token: null, error: `코드 교환 실패 (HTTP ${res.status})` };
        const body = await res.json();
        if (!body || !body.accessToken) return { token: null, error: '코드 교환 응답에 accessToken 이 없습니다.' };
        sessionStorage.setItem(KEY, body.accessToken);
        return { token: body.accessToken, error: null };
    } catch (e) {
        return { token: null, error: `코드 교환 요청 실패: ${e && e.message ? e.message : e}` };
    }
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
    } catch (e) {
        // 서버 로그아웃 실패여도 로컬 토큰은 지운다.
    } finally {
        sessionStorage.removeItem(KEY);
    }
}
