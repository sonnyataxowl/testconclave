namespace Conclave.Client.Services;

public interface IMeetingService
{
    /// <summary>내 회의를 최신순(생성 시각 내림차순)으로 돌려준다.</summary>
    Task<IReadOnlyList<Meeting>> ListMineAsync(CancellationToken cancellationToken = default);
}
