using Microsoft.AspNetCore.Identity;

namespace Zingle.API.Models;

public class AppUser : IdentityUser
{
    public string? DisplayName { get; set; }
    public string? Nickname { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastActive { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Chat> Chats { get; set; } = new List<Chat>();
    public ICollection<ChatParticipant> ChatParticipants { get; set; } = new List<ChatParticipant>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<FriendRequest> SentFriendRequests { get; set; } = new List<FriendRequest>();
    public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } = new List<FriendRequest>();
    public ICollection<Friendship> Friendships1 { get; set; } = new List<Friendship>();
    public ICollection<Friendship> Friendships2 { get; set; } = new List<Friendship>();
    public ICollection<CallLog> InitiatedCalls { get; set; } = new List<CallLog>();
    public ICollection<CallLog> ReceivedCalls { get; set; } = new List<CallLog>();
}
