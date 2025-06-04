namespace Zingle.API.Models;

public enum MessageType
{
    Text,
    Image,
    File,
    System
}

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ChatId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public MessageType Type { get; set; } = MessageType.Text;
    public string? ImageUrl { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }

    // Navigation properties
    public Chat Chat { get; set; } = null!;
    public AppUser Sender { get; set; } = null!;
}
