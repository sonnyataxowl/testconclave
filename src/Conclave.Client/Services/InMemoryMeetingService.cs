namespace Conclave.Client.Services;

/// <summary>DB 저장 API 가 정해지기 전까지 쓰는 메모리 구현.</summary>
public sealed class InMemoryMeetingService : IMeetingService
{
    private readonly List<Meeting> _meetings = new();

    public Task<IReadOnlyList<Meeting>> ListAsync() =>
        Task.FromResult<IReadOnlyList<Meeting>>(_meetings.ToList());

    public Task<Meeting> CreateAsync(string title)
    {
        var error = MeetingTitleValidator.Validate(title);
        if (error is not null)
            throw new ArgumentException(error, nameof(title));

        var meeting = new Meeting(Guid.NewGuid(), title.Trim(), DateTimeOffset.UtcNow);
        _meetings.Insert(0, meeting);
        return Task.FromResult(meeting);
    }
}
