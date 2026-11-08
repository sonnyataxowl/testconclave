using Conclave.Client;
using Conclave.Client.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(_ => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<InMemoryMeetingService>();
builder.Services.AddSingleton<IMeetingService>(sp => sp.GetRequiredService<InMemoryMeetingService>());

await builder.Build().RunAsync();
