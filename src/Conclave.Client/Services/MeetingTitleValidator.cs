namespace Conclave.Client.Services;

public static class MeetingTitleValidator
{
    public const int MaxLength = 100;

    /// <summary>제목이 올바르면 null, 아니면 사용자에게 보일 오류 메시지를 돌려준다.</summary>
    public static string? Validate(string? title)
    {
        var trimmed = title?.Trim();
        if (string.IsNullOrEmpty(trimmed))
            return "회의 제목을 입력해 주세요.";
        if (trimmed.Length > MaxLength)
            return $"회의 제목은 {MaxLength}자 이하로 입력해 주세요.";
        return null;
    }
}
