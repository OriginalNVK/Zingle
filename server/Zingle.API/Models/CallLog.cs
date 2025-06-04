namespace Zingle.API.Models;

public enum CallType
{
    Audio,
    Video
}

public enum CallState
{
    Initiated,
    Active,
    Missed,
    Rejected,
    Completed
}

public class CallLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CallerId { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
    public CallType Type { get; set; }
    public CallState State { get; set; }
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public int? DurationSeconds { get; set; }

    // Navigation properties
    public AppUser Caller { get; set; } = null!;
    public AppUser Recipient { get; set; } = null!;
}
