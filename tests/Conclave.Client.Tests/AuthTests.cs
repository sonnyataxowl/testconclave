using System.Text;
using Conclave.Client.Pages;
using Conclave.Client.Services;
using Microsoft.AspNetCore.Components;

namespace Conclave.Client.Tests;

public class AuthTests
{
    private static string Jwt(string payloadJson)
    {
        static string B64(string s) => Convert.ToBase64String(Encoding.UTF8.GetBytes(s))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return $"{B64("{\"alg\":\"none\"}")}.{B64(payloadJson)}.sig";
    }

    [Fact]
    public void BuildLoginUrl_EncodesRedirect()
    {
        var url = AuthUrls.BuildLoginUrl("https://login.axowl.com/", "client_x", "https://app.example/");
        Assert.Equal("https://login.axowl.com/login/client_x?redirect_url=https%3A%2F%2Fapp.example%2F", url);
    }

    [Fact]
    public void ExtractCode_ReadsCodeQuery()
    {
        Assert.Equal("abc123", AuthUrls.ExtractCode("https://app.example/?code=abc123"));
        Assert.Equal("abc", AuthUrls.ExtractCode("https://app.example/?x=1&code=abc"));
    }

    [Fact]
    public void ExtractCode_ReturnsNullWhenAbsentOrEmpty()
    {
        Assert.Null(AuthUrls.ExtractCode("https://app.example/"));
        Assert.Null(AuthUrls.ExtractCode("https://app.example/?code="));
        Assert.Null(AuthUrls.ExtractCode("https://app.example/?other=1"));
    }

    [Fact]
    public void StripCode_RemovesOnlyCode()
    {
        Assert.Equal("https://app.example/", AuthUrls.StripCode("https://app.example/?code=abc"));
        Assert.Equal("https://app.example/?x=1", AuthUrls.StripCode("https://app.example/?x=1&code=abc"));
    }

    [Fact]
    public void Parse_ReadsNameAndExpiry()
    {
        var info = JwtClaims.Parse(Jwt("{\"name\":\"홍길동\",\"exp\":4102444800}"));
        Assert.NotNull(info);
        Assert.Equal("홍길동", info!.DisplayName);
        Assert.Equal(DateTimeOffset.FromUnixTimeSeconds(4102444800), info.ExpiresAt);
    }

    [Fact]
    public void Parse_FallsBackToEmailThenSub()
    {
        Assert.Equal("a@b.c", JwtClaims.Parse(Jwt("{\"email\":\"a@b.c\",\"sub\":\"u1\"}"))!.DisplayName);
        Assert.Equal("u1", JwtClaims.Parse(Jwt("{\"sub\":\"u1\"}"))!.DisplayName);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-jwt")]
    [InlineData("a.%%%.c")]
    public void Parse_RejectsMalformedTokens(string? token)
    {
        Assert.Null(JwtClaims.Parse(token));
    }

    [Fact]
    public void MeetingsPage_IsRoutedAtMeetings()
    {
        var route = typeof(Meetings).GetCustomAttributes(typeof(RouteAttribute), false)
            .Cast<RouteAttribute>().Single();
        Assert.Equal("/meetings", route.Template);
    }
}
