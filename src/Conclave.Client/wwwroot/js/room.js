// LiveKit 방 입장·퇴장. 서버 URL 과 접속 토큰은 엣지 함수(/api/livekit-token)가 준다.
const SDK_URL = 'https://cdn.jsdelivr.net/npm/livekit-client@2/dist/livekit-client.esm.mjs';

let room = null;

export async function join(container, roomId, name, accessToken) {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch('/api/livekit-token', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room: roomId, name }),
    });
    if (!res.ok) {
        let msg = `입장 토큰을 받지 못했습니다 (${res.status}).`;
        try { msg = (await res.json()).message ?? msg; } catch { /* 본문 없음 */ }
        throw new Error(msg);
    }
    const { url, token } = await res.json();

    const { Room, RoomEvent, Track } = await import(SDK_URL);
    room = new Room();
    const attach = (track, participant) => {
        if (track.kind !== Track.Kind.Video && track.kind !== Track.Kind.Audio) return;
        const el = track.attach();
        el.dataset.participant = participant.identity;
        container.appendChild(el);
    };
    room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => attach(track, participant));
    room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((el) => el.remove()));
    room.on(RoomEvent.LocalTrackPublished, (pub, participant) => pub.track && attach(pub.track, participant));
    room.on(RoomEvent.Disconnected, () => { container.replaceChildren(); room = null; });

    await room.connect(url, token);
    try {
        await room.localParticipant.enableCameraAndMicrophone();
    } catch {
        // 카메라·마이크 권한이 없어도 방에는 들어간다.
    }
}

export async function leave() {
    if (room) await room.disconnect();
    room = null;
}
