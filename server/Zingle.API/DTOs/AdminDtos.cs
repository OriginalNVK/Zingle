namespace Zingle.API.DTOs;

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
}

public class ChangeRoleDto
{
    public string Role { get; set; } = string.Empty;
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int OnlineUsers { get; set; }
    public int TotalChats { get; set; }
    public int GroupChats { get; set; }
    public int DirectChats { get; set; }
    public int TotalMessages { get; set; }
    public int MessagesToday { get; set; }
}
