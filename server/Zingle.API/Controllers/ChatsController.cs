using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Zingle.API.Data;
using Zingle.API.DTOs;
using Zingle.API.Models;

namespace Zingle.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ChatsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly ILogger<ChatsController> _logger;

    public ChatsController(
        ApplicationDbContext context,
        UserManager<AppUser> userManager,
        ILogger<ChatsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<ChatDto>>> GetChats()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var chatParticipants = await _context.ChatParticipants
            .Where(cp => cp.UserId == userId)
            .Include(cp => cp.Chat)
                .ThenInclude(c => c.Participants)
                    .ThenInclude(p => p.User)
            .Include(cp => cp.Chat)
                .ThenInclude(c => c.Messages.OrderByDescending(m => m.Timestamp).Take(1))
                    .ThenInclude(m => m.Sender)
            .ToListAsync();

        var chats = chatParticipants.Select(cp => new ChatDto
        {
            Id = cp.Chat.Id,
            Name = cp.Chat.IsGroupChat
                ? cp.Chat.Name
                : cp.Chat.Participants
                    .FirstOrDefault(p => p.UserId != userId)?.User.DisplayName
                    ?? cp.Chat.Participants
                        .FirstOrDefault(p => p.UserId != userId)?.User.UserName
                    ?? cp.Chat.Name,
            IsGroupChat = cp.Chat.IsGroupChat,
            AvatarUrl = cp.Chat.IsGroupChat
                ? cp.Chat.AvatarUrl
                : cp.Chat.Participants
                    .FirstOrDefault(p => p.UserId != userId)?.User.AvatarUrl,
            CreatedAt = cp.Chat.CreatedAt,
            LastActivity = cp.Chat.LastActivity,
            LastMessage = cp.Chat.Messages.Any()
                ? MapMessageToDto(cp.Chat.Messages.OrderByDescending(m => m.Timestamp).First())
                : null,
            UnreadCount = cp.Chat.Messages.Count(m =>
                m.Timestamp > (cp.LastReadMessageTime ?? DateTime.MinValue) &&
                m.SenderId != userId),
            Participants = cp.Chat.Participants.Select(p => new ChatParticipantDto
            {
                UserId = p.UserId,
                Username = p.User.UserName ?? string.Empty,
                DisplayName = p.User.DisplayName,
                AvatarUrl = p.User.AvatarUrl,
                IsOnline = p.User.IsOnline,
                LastActive = p.User.LastActive,
                CustomNickname = p.CustomNickname,
                IsAdmin = p.IsAdmin
            }).ToList(),
            IsTyping = false // Will be managed by SignalR
        }).ToList();

        return chats;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ChatDto>> GetChat(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var chatParticipant = await _context.ChatParticipants
            .Where(cp => cp.ChatId == id && cp.UserId == userId)
            .Include(cp => cp.Chat)
                .ThenInclude(c => c.Participants)
                    .ThenInclude(p => p.User)
            .Include(cp => cp.Chat)
                .ThenInclude(c => c.Messages.OrderByDescending(m => m.Timestamp).Take(1))
                    .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync();

        if (chatParticipant == null)
        {
            return NotFound();
        }

        var chat = chatParticipant.Chat;

        return new ChatDto
        {
            Id = chat.Id,
            Name = chat.IsGroupChat
                ? chat.Name
                : chat.Participants
                    .FirstOrDefault(p => p.UserId != userId)?.User.DisplayName
                    ?? chat.Participants
                        .FirstOrDefault(p => p.UserId != userId)?.User.UserName
                    ?? chat.Name,
            IsGroupChat = chat.IsGroupChat,
            AvatarUrl = chat.IsGroupChat
                ? chat.AvatarUrl
                : chat.Participants
                    .FirstOrDefault(p => p.UserId != userId)?.User.AvatarUrl,
            CreatedAt = chat.CreatedAt,
            LastActivity = chat.LastActivity,
            LastMessage = chat.Messages.Any()
                ? MapMessageToDto(chat.Messages.OrderByDescending(m => m.Timestamp).First())
                : null,
            UnreadCount = chat.Messages.Count(m =>
                m.Timestamp > (chatParticipant.LastReadMessageTime ?? DateTime.MinValue) &&
                m.SenderId != userId),
            Participants = chat.Participants.Select(p => new ChatParticipantDto
            {
                UserId = p.UserId,
                Username = p.User.UserName ?? string.Empty,
                DisplayName = p.User.DisplayName,
                AvatarUrl = p.User.AvatarUrl,
                IsOnline = p.User.IsOnline,
                LastActive = p.User.LastActive,
                CustomNickname = p.CustomNickname,
                IsAdmin = p.IsAdmin
            }).ToList(),
            IsTyping = false // Will be managed by SignalR
        };
    }

    [HttpPost]
    public async Task<ActionResult<ChatDto>> CreateChat(CreateChatDto createChatDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Add current user to participants if not already included
        if (!createChatDto.ParticipantIds.Contains(userId))
        {
            createChatDto.ParticipantIds.Add(userId);
        }

        // Check if this is a one-on-one chat and if it already exists
        if (!createChatDto.IsGroupChat && createChatDto.ParticipantIds.Count == 2)
        {
            var otherUserId = createChatDto.ParticipantIds.First(id => id != userId);

            // Check if a one-on-one chat already exists with this user
            var existingChat = await _context.Chats
                .Where(c => !c.IsGroupChat)
                .Where(c => c.Participants.Count == 2)
                .Where(c => c.Participants.Any(p => p.UserId == userId))
                .Where(c => c.Participants.Any(p => p.UserId == otherUserId))
                .Include(c => c.Participants)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync();

            if (existingChat != null)
            {
                // Return existing chat instead of creating a new one
                return new ChatDto
                {
                    Id = existingChat.Id,
                    Name = existingChat.Participants
                        .FirstOrDefault(p => p.UserId != userId)?.User.DisplayName
                        ?? existingChat.Participants
                            .FirstOrDefault(p => p.UserId != userId)?.User.UserName
                        ?? existingChat.Name,
                    IsGroupChat = existingChat.IsGroupChat,
                    AvatarUrl = existingChat.Participants
                        .FirstOrDefault(p => p.UserId != userId)?.User.AvatarUrl,
                    CreatedAt = existingChat.CreatedAt,
                    LastActivity = existingChat.LastActivity,
                    Participants = existingChat.Participants.Select(p => new ChatParticipantDto
                    {
                        UserId = p.UserId,
                        Username = p.User.UserName ?? string.Empty,
                        DisplayName = p.User.DisplayName,
                        AvatarUrl = p.User.AvatarUrl,
                        IsOnline = p.User.IsOnline,
                        LastActive = p.User.LastActive,
                        CustomNickname = p.CustomNickname,
                        IsAdmin = p.IsAdmin
                    }).ToList(),
                    IsTyping = false
                };
            }
        }

        // Create new chat
        var chat = new Chat
        {
            Name = createChatDto.Name ?? (createChatDto.IsGroupChat ? "Group Chat" : string.Empty),
            IsGroupChat = createChatDto.IsGroupChat,
            AvatarUrl = createChatDto.AvatarUrl,
            CreatedAt = DateTime.UtcNow,
            LastActivity = DateTime.UtcNow
        };

        // Add participants
        foreach (var participantId in createChatDto.ParticipantIds)
        {
            var user = await _userManager.FindByIdAsync(participantId);
            if (user != null)
            {
                var isAdmin = participantId == userId; // Creator is admin

                chat.Participants.Add(new ChatParticipant
                {
                    UserId = participantId,
                    Chat = chat,
                    JoinedAt = DateTime.UtcNow,
                    IsAdmin = isAdmin
                });
            }
        }

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync();

        // Load participants for return
        await _context.Entry(chat)
            .Collection(c => c.Participants)
            .Query()
            .Include(p => p.User)
            .LoadAsync();

        // Construct return DTO
        return new ChatDto
        {
            Id = chat.Id,
            Name = chat.IsGroupChat
                ? chat.Name
                : chat.Participants
                    .FirstOrDefault(p => p.UserId != userId)?.User.DisplayName
                    ?? chat.Participants
                        .FirstOrDefault(p => p.UserId != userId)?.User.UserName
                    ?? chat.Name,
            IsGroupChat = chat.IsGroupChat,
            AvatarUrl = chat.IsGroupChat
                ? chat.AvatarUrl
                : chat.Participants
                    .FirstOrDefault(p => p.UserId != userId)?.User.AvatarUrl,
            CreatedAt = chat.CreatedAt,
            LastActivity = chat.LastActivity,
            Participants = chat.Participants.Select(p => new ChatParticipantDto
            {
                UserId = p.UserId,
                Username = p.User.UserName ?? string.Empty,
                DisplayName = p.User.DisplayName,
                AvatarUrl = p.User.AvatarUrl,
                IsOnline = p.User.IsOnline,
                LastActive = p.User.LastActive,
                CustomNickname = p.CustomNickname,
                IsAdmin = p.IsAdmin
            }).ToList(),
            IsTyping = false
        };
    }

    [HttpGet("{chatId}/messages")]
    public async Task<ActionResult<List<MessageDto>>> GetMessages(string chatId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Check if user is participant of this chat
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

        if (!isParticipant)
        {
            return Forbid();
        }

        var messages = await _context.Messages
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.Timestamp)
            .Include(m => m.Sender)
            .ToListAsync();

        // Update last read time
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

        if (participant != null && messages.Any())
        {
            participant.LastReadMessageTime = messages.Max(m => m.Timestamp);
            await _context.SaveChangesAsync();
        }

        return messages.Select(MapMessageToDto).ToList();
    }

    [HttpPost("{chatId}/messages")]
    public async Task<ActionResult<MessageDto>> CreateMessage(string chatId, CreateMessageDto createMessageDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Check if user is participant of this chat
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

        if (!isParticipant)
        {
            return Forbid();
        }

        // Get user
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Unauthorized();
        }

        // Create message
        MessageType messageType = MessageType.Text;
        if (Enum.TryParse<MessageType>(createMessageDto.Type, true, out var parsedType))
        {
            messageType = parsedType;
        }

        var message = new Message
        {
            ChatId = chatId,
            SenderId = userId,
            Content = createMessageDto.Content,
            Timestamp = DateTime.UtcNow,
            Type = messageType,
            ImageUrl = createMessageDto.ImageUrl,
            FileUrl = createMessageDto.FileUrl,
            FileName = createMessageDto.FileName,
            FileSize = createMessageDto.FileSize
        };

        _context.Messages.Add(message);

        // Update chat last activity
        var chat = await _context.Chats.FindAsync(chatId);
        if (chat != null)
        {
            chat.LastActivity = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Load sender for return
        await _context.Entry(message)
            .Reference(m => m.Sender)
            .LoadAsync();

        return MapMessageToDto(message);
    }

    [HttpPut("{chatId}/read")]
    public async Task<IActionResult> MarkAsRead(string chatId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Check if user is participant of this chat
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

        if (participant == null)
        {
            return NotFound();
        }

        // Find latest message timestamp
        var latestMessage = await _context.Messages
            .Where(m => m.ChatId == chatId)
            .OrderByDescending(m => m.Timestamp)
            .FirstOrDefaultAsync();

        if (latestMessage != null)
        {
            participant.LastReadMessageTime = latestMessage.Timestamp;
            await _context.SaveChangesAsync();
        }

        return Ok();
    }

    [HttpDelete("{chatId}")]
    public async Task<IActionResult> DeleteChat(string chatId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Check if user is admin of this chat
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId && cp.IsAdmin);

        if (participant == null)
        {
            return Forbid();
        }

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null)
        {
            return NotFound();
        }

        _context.Chats.Remove(chat);
        await _context.SaveChangesAsync();

        return Ok();
    }

    private static MessageDto MapMessageToDto(Message message)
    {
        return new MessageDto
        {
            Id = message.Id,
            ChatId = message.ChatId,
            SenderId = message.SenderId,
            SenderUsername = message.Sender?.UserName ?? string.Empty,
            SenderAvatarUrl = message.Sender?.AvatarUrl,
            Content = message.Content,
            Timestamp = message.Timestamp,
            Type = message.Type.ToString().ToLowerInvariant(),
            ImageUrl = message.ImageUrl,
            FileUrl = message.FileUrl,
            FileName = message.FileName,
            FileSize = message.FileSize,
            IsRead = true, // This will be determined by the client based on LastReadMessageTime
            Status = "delivered" // This would be handled differently in a real app
        };
    }
}
