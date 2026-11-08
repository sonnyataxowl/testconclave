using Bunit;
using Conclave.Client.Services;
using Conclave.Client.Shared;
using Microsoft.Extensions.DependencyInjection;

namespace Conclave.Client.Tests;

public class MeetingListTests : TestContext
{
    private sealed class FailingService : IMeetingService
    {
        public Task<IReadOnlyList<Meeting>> ListMineAsync(CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("boom");
    }

    private sealed class PendingService : IMeetingService
    {
        public TaskCompletionSource<IReadOnlyList<Meeting>> Source { get; } = new();

        public Task<IReadOnlyList<Meeting>> ListMineAsync(CancellationToken cancellationToken = default)
            => Source.Task;
    }

    [Fact]
    public void ShowsGuidanceWhenNoMeetings()
    {
        Services.AddSingleton<IMeetingService>(new InMemoryMeetingService());

        var cut = RenderComponent<MeetingList>();

        Assert.Contains("아직 회의가 없습니다", cut.Markup);
        Assert.Empty(cut.FindAll("li"));
    }

    [Fact]
    public void ShowsMeetingsNewestFirstWithTitle()
    {
        var service = new InMemoryMeetingService();
        service.Add("오래된 회의", new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
        service.Add("최근 회의", new DateTimeOffset(2026, 3, 1, 9, 0, 0, TimeSpan.Zero));
        Services.AddSingleton<IMeetingService>(service);

        var cut = RenderComponent<MeetingList>();

        var items = cut.FindAll("li");
        Assert.Equal(2, items.Count);
        Assert.Contains("최근 회의", items[0].TextContent);
        Assert.Contains("오래된 회의", items[1].TextContent);
        Assert.NotEmpty(items[0].QuerySelectorAll("time"));
        Assert.DoesNotContain("아직 회의가 없습니다", cut.Markup);
    }

    [Fact]
    public void ShowsLoadingWhileFetching()
    {
        var pending = new PendingService();
        Services.AddSingleton<IMeetingService>(pending);

        var cut = RenderComponent<MeetingList>();
        Assert.Contains("불러오는 중", cut.Markup);

        pending.Source.SetResult(Array.Empty<Meeting>());
        cut.WaitForAssertion(() => Assert.Contains("아직 회의가 없습니다", cut.Markup));
    }

    [Fact]
    public void ShowsErrorAndRetryButton()
    {
        Services.AddSingleton<IMeetingService>(new FailingService());

        var cut = RenderComponent<MeetingList>();

        Assert.Contains("불러오지 못했습니다", cut.Markup);
        Assert.NotNull(cut.Find("button"));
    }
}
