namespace Zingle.API.Models;

public enum FriendRequestStatus
{
    Pending,
    Accepted,
    Declined,
    Blocked
}

public class FriendRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FromUserId { get; set; } = string.Empty;
    public string ToUserId { get; set; } = string.Empty;
    public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    // Navigation properties
    public AppUser FromUser { get; set; } = null!;
    public AppUser ToUser { get; set; } = null!;
}
