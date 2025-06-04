namespace Zingle.API.DTOs;

public class FriendRequestDto
{
    public string Id { get; set; } = string.Empty;
    public UserDto FromUser { get; set; } = null!;
    public UserDto ToUser { get; set; } = null!;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}

public class CreateFriendRequestDto
{
    public string ToUserId { get; set; } = string.Empty;
}

public class FriendshipDto
{
    public string Id { get; set; } = string.Empty;
    public UserDto Friend { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
