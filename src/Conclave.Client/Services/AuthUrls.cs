namespace Conclave.Client.Services;

public static class AuthUrls
{
    public static string BuildLoginUrl(string portal, string clientKey, string redirectUrl) =>
        $"{portal.TrimEnd('/')}/login/{clientKey}?redirect_url={Uri.EscapeDataString(redirectUrl)}";

    public static string? ExtractCode(string uri)
    {
        foreach (var (key, value) in QueryPairs(uri))
        {
            if (key == "code" && value.Length > 0) return value;
        }
        return null;
    }

    public static string StripCode(string uri)
    {
        var u = new Uri(uri);
        var rest = string.Join("&", u.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Where(p => Uri.UnescapeDataString(p.Split('=', 2)[0]) != "code"));
        return u.GetLeftPart(UriPartial.Path) + (rest.Length > 0 ? "?" + rest : "") + u.Fragment;
    }

    private static IEnumerable<(string Key, string Value)> QueryPairs(string uri)
    {
        foreach (var part in new Uri(uri).Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = part.Split('=', 2);
            yield return (
                Uri.UnescapeDataString(kv[0]),
                kv.Length == 2 ? Uri.UnescapeDataString(kv[1].Replace('+', ' ')) : "");
        }
    }
}
