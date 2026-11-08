using System.Text;
using System.Text.Json;

namespace Conclave.Client.Services;

public sealed record JwtInfo(string? DisplayName, DateTimeOffset? ExpiresAt);

/// <summary>화면 표시용으로만 페이로드를 읽는다. 서명 검증은 서버의 몫이다.</summary>
public static class JwtClaims
{
    private static readonly string[] NameClaims = { "name", "email", "preferred_username", "sub" };

    public static JwtInfo? Parse(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var parts = token.Split('.');
        if (parts.Length != 3) return null;
        try
        {
            var b64 = parts[1].Replace('-', '+').Replace('_', '/');
            b64 = b64.PadRight(b64.Length + (4 - b64.Length % 4) % 4, '=');
            using var doc = JsonDocument.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(b64)));
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return null;

            string? name = null;
            foreach (var claim in NameClaims)
            {
                if (root.TryGetProperty(claim, out var v) && v.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(v.GetString()))
                {
                    name = v.GetString();
                    break;
                }
            }

            DateTimeOffset? exp = root.TryGetProperty("exp", out var e) && e.TryGetInt64(out var secs)
                ? DateTimeOffset.FromUnixTimeSeconds(secs)
                : null;
            return new JwtInfo(name, exp);
        }
        catch (Exception ex) when (ex is FormatException or JsonException or ArgumentException)
        {
            return null;
        }
    }
}
