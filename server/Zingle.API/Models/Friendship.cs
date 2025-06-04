namespace Zingle.API.Models;

public class Friendship
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string User1Id { get; set; } = string.Empty;
    public string User2Id { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public AppUser User1 { get; set; } = null!;
    public AppUser User2 { get; set; } = null!;
}
