using Conclave.Client.Services;

namespace Conclave.Client.Tests;

public class MeetingTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_RejectsEmptyTitle(string? title)
    {
        Assert.NotNull(MeetingTitleValidator.Validate(title));
    }

    [Fact]
    public void Validate_RejectsTooLongTitle()
    {
        Assert.NotNull(MeetingTitleValidator.Validate(new string('가', MeetingTitleValidator.MaxLength + 1)));
    }

    [Fact]
    public void Validate_AcceptsBoundaryAndTrimmedTitle()
    {
        Assert.Null(MeetingTitleValidator.Validate(new string('a', MeetingTitleValidator.MaxLength)));
        Assert.Null(MeetingTitleValidator.Validate("  주간 회의  "));
    }

    [Fact]
    public async Task Create_PutsNewestMeetingFirstAndTrims()
    {
        var svc = new InMemoryMeetingService();
        await svc.CreateAsync("첫째");
        await svc.CreateAsync("  둘째  ");

        var list = await svc.ListAsync();
        Assert.Equal(new[] { "둘째", "첫째" }, list.Select(m => m.Title));
    }

    [Fact]
    public async Task Create_ThrowsOnInvalidTitle()
    {
        var svc = new InMemoryMeetingService();
        await Assert.ThrowsAsync<ArgumentException>(() => svc.CreateAsync(" "));
        Assert.Empty(await svc.ListAsync());
    }
}
