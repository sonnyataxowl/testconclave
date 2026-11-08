# Conclave

회의가 끝나면 그 기록이 진짜임을 누구나 확인할 수 있는 화상회의 앱.

- 프런트엔드: Blazor WebAssembly (`src/Conclave.Client`), React 사용 안 함
- 실시간: LiveKit Cloud (다음 에픽)
- 배포: Cloudflare Pages 정적 배포 (`.github/workflows/axowl-pages.yml`, 승인 후 설치됨)

## 빌드와 테스트

```
dotnet build Conclave.sln
dotnet test Conclave.sln
dotnet run --project src/Conclave.Client
```
