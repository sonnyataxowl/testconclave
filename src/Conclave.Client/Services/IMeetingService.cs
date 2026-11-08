namespace Conclave.Client.Services;

public interface IMeetingService
{
    /// <summary>최신 회의가 맨 앞에 오는 목록.</summary>
    Task<IReadOnlyList<Meeting>> ListAsync();

    /// <summary>제목을 검증한 뒤 회의를 만든다. 잘못된 제목이면 ArgumentException.</summary>
    Task<Meeting> CreateAsync(string title);
}
