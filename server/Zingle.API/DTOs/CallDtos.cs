using Zingle.API.Models;

namespace Zingle.API.DTOs;

public class CallLogDto
{
    public string Id { get; set; } = string.Empty;
    public string CallerId { get; set; } = string.Empty;
    public string CallerName { get; set; } = string.Empty;
    public string CallerAvatarUrl { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientAvatarUrl { get; set; } = string.Empty;
    public CallType Type { get; set; }
    public CallState State { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationSeconds { get; set; }
}

public class CreateCallLogDto
{
    public string CallerId { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
    public CallType Type { get; set; }
    public CallState State { get; set; }
}

public class CallSignalDto
{
    public string CallId { get; set; } = string.Empty;
    public string? CallType { get; set; }
    public UserDto? Caller { get; set; }
    public string? CalleeId { get; set; }
    public string? Signal { get; set; }
    public object? Data { get; set; }
}
