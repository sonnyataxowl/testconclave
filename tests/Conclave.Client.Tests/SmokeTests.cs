using Conclave.Client;
using Conclave.Client.Pages;
using Microsoft.AspNetCore.Components;

namespace Conclave.Client.Tests;

public class SmokeTests
{
    [Fact]
    public void Home_ExposesRootRoute()
    {
        var route = typeof(Home).GetCustomAttributes(typeof(RouteAttribute), false)
            .Cast<RouteAttribute>()
            .Single();

        Assert.Equal("/", route.Template);
    }

    [Fact]
    public void App_IsRouterRoot()
    {
        Assert.True(typeof(IComponent).IsAssignableFrom(typeof(App)));
    }
}
