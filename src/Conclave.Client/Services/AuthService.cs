using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Conclave.Client.Services;

public sealed class AuthService
{
    private readonly IJSRuntime _js;
    private readonly NavigationManager _nav;
    private readonly string _clientKey;
    private readonly string _portal;
    private readonly string _apiBase;
    private Task? _init;
    private IJSObjectReference? _module;

    public AuthService(IJSRuntime js, NavigationManager nav, IConfiguration config)
    {
        _js = js;
        _nav = nav;
        _clientKey = config["Axowl:ClientKey"] ?? throw new InvalidOperationException("Axowl:ClientKey 설정이 없습니다.");
        _portal = config["Axowl:HostedLoginUrl"] ?? "https://login.axowl.com";
        _apiBase = (config["Axowl:ApiBaseUrl"] ?? "https://api.axowl.com").TrimEnd('/');
    }

    public event Action? Changed;

    public bool IsReady { get; private set; }
    public bool IsSignedIn { get; private set; }
    public string? DisplayName { get; private set; }
    public string? AccessToken { get; private set; }

    public string LoginUrl => AuthUrls.BuildLoginUrl(_portal, _clientKey, _nav.BaseUri);

    public Task InitializeAsync() => _init ??= InitCoreAsync();

    private async Task InitCoreAsync()
    {
        try
        {
            _module = await _js.InvokeAsync<IJSObjectReference>("import", "./js/auth.js");
            string? token = null;

            var code = AuthUrls.ExtractCode(_nav.Uri);
            if (code is not null)
            {
                token = await _module.InvokeAsync<string?>("exchange", _apiBase, _clientKey, code);
                _nav.NavigateTo(AuthUrls.StripCode(_nav.Uri), replace: true);
            }
            else
            {
                token = await _module.InvokeAsync<string?>("getToken");
            }

            await ApplyTokenAsync(token);
        }
        finally
        {
            IsReady = true;
            Changed?.Invoke();
        }
    }

    private async Task ApplyTokenAsync(string? token)
    {
        var info = JwtClaims.Parse(token);
        if (info is null || (info.ExpiresAt is { } exp && exp <= DateTimeOffset.UtcNow))
        {
            if (token is not null && _module is not null) await _module.InvokeVoidAsync("clearToken");
            AccessToken = null;
            DisplayName = null;
            IsSignedIn = false;
            return;
        }

        AccessToken = token;
        DisplayName = info.DisplayName;
        IsSignedIn = true;
    }

    public async Task SignOutAsync()
    {
        await InitializeAsync();
        if (_module is not null) await _module.InvokeVoidAsync("logout", _apiBase, _clientKey);
        AccessToken = null;
        DisplayName = null;
        IsSignedIn = false;
        Changed?.Invoke();
        _nav.NavigateTo("");
    }
}
