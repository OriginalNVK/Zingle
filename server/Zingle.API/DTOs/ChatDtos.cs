namespace Zingle.API.DTOs;

public class ChatDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsGroupChat { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivity { get; set; }
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public List<ChatParticipantDto> Participants { get; set; } = new();
    public bool IsTyping { get; set; }
}

public class ChatParticipantDto
{
    public string UserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastActive { get; set; }
    public string? CustomNickname { get; set; }
    public bool IsAdmin { get; set; }
}

public class CreateChatDto
{
    public bool IsGroupChat { get; set; }
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
    public List<string> ParticipantIds { get; set; } = new();
}

public class UpdateChatDto
{
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
}
