namespace Conclave.Client.Services;

/// <summary>DB 연동 전까지 쓰는 메모리 구현. 새로고침하면 사라진다.</summary>
public sealed class InMemoryMeetingService : IMeetingService
{
    private readonly List<Meeting> _meetings = new();

    public Meeting Add(string title, DateTimeOffset? createdAt = null)
    {
        var meeting = new Meeting(Guid.NewGuid().ToString("N"), title, createdAt ?? DateTimeOffset.UtcNow);
        _meetings.Add(meeting);
        return meeting;
    }

    public Task<IReadOnlyList<Meeting>> ListMineAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<Meeting> result = _meetings.OrderByDescending(m => m.CreatedAt).ToList();
        return Task.FromResult(result);
    }
}
