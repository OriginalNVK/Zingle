namespace Zingle.API.Models;

public class ChatParticipant
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ChatId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? CustomNickname { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsAdmin { get; set; }
    public DateTime? LastReadMessageTime { get; set; }

    // Navigation properties
    public Chat Chat { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
