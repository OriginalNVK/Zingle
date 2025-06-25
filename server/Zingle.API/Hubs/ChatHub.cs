using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Zingle.API.DTOs;
using Zingle.API.Data;
using Zingle.API.Models;
using System.Security.Claims;

namespace Zingle.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;
    private readonly ApplicationDbContext _context;

    public ChatHub(ILogger<ChatHub> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation("User {UserId} connected to ChatHub", userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation("User {UserId} disconnected from ChatHub", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    // Message methods
    public async Task SendMessage(CreateMessageDto messageDto)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Unauthorized attempt to send message");
            return;
        }

        try
        {
            // Check if user is participant in the chat
            var chatParticipant = await _context.ChatParticipants
                .FirstOrDefaultAsync(cp => cp.ChatId == messageDto.ChatId && cp.UserId == userId);

            if (chatParticipant == null)
            {
                _logger.LogWarning("User {UserId} attempted to send message to chat {ChatId} without being a participant", userId, messageDto.ChatId);
                return;
            }

            // Parse message type
            if (!Enum.TryParse<MessageType>(messageDto.Type, true, out var messageType))
            {
                messageType = MessageType.Text;
            }

            // Create and save the message
            var message = new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = messageDto.ChatId,
                SenderId = userId,
                Content = messageDto.Content,
                Type = messageType,
                ImageUrl = messageDto.ImageUrl,
                FileUrl = messageDto.FileUrl,
                FileName = messageDto.FileName,
                FileSize = messageDto.FileSize,
                Timestamp = DateTime.UtcNow
            };

            _context.Messages.Add(message);

            // Update chat's last activity
            var chat = await _context.Chats.FindAsync(messageDto.ChatId);
            if (chat != null)
            {
                chat.LastActivity = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Get sender information
            var sender = await _context.Users.FindAsync(userId);

            // Broadcast to the chat group
            await Clients.Group(messageDto.ChatId).SendAsync("ReceiveMessage", new
            {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                SenderUsername = sender?.UserName ?? "Unknown",
                Content = message.Content,
                Timestamp = message.Timestamp,
                Type = message.Type.ToString(),
                ImageUrl = message.ImageUrl,
                FileUrl = message.FileUrl,
                FileName = message.FileName,
                FileSize = message.FileSize,
                IsRead = false, // Frontend expects this field
                Status = "sent"
            });

            _logger.LogInformation("Message sent by user {UserId} to chat {ChatId}", userId, messageDto.ChatId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message from user {UserId} to chat {ChatId}", userId, messageDto.ChatId);
        }
    }

    public async Task SendTypingIndicator(string chatId, bool isTyping)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        // Check if user is participant in the chat
        var chatParticipant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

        if (chatParticipant == null)
        {
            return;
        }

        var username = Context.User?.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var displayName = Context.User?.FindFirstValue("displayName") ?? username;

        await Clients.GroupExcept(chatId, Context.ConnectionId).SendAsync("ReceiveTypingIndicator", new
        {
            ChatId = chatId,
            UserId = userId,
            UserName = username,
            DisplayName = displayName,
            IsTyping = isTyping,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task JoinChat(string chatId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        // Check if user is participant in the chat
        var chatParticipant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

        if (chatParticipant == null)
        {
            _logger.LogWarning("User {UserId} attempted to join chat {ChatId} without being a participant", userId, chatId);
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
        _logger.LogInformation("User {UserId} joined chat {ChatId}", userId, chatId);
    }

    public async Task LeaveChat(string chatId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
        _logger.LogInformation("User {UserId} left chat {ChatId}", userId, chatId);
    }

    public async Task MarkMessageAsRead(string chatId, string messageId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        try
        {
            // Check if user is participant in the chat
            var chatParticipant = await _context.ChatParticipants
                .FirstOrDefaultAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

            if (chatParticipant == null)
            {
                return;
            }

            // Update last read time for the participant
            chatParticipant.LastReadMessageTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Notify other users in the chat that the current user has read the message
            await Clients.GroupExcept(chatId, Context.ConnectionId).SendAsync("MessageStatus", new
            {
                ChatId = chatId,
                MessageId = messageId,
                UserId = userId,
                Status = "read"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message {MessageId} as read by user {UserId}", messageId, userId);
        }
    }

    // Call signaling methods
    public async Task InitiateCall(CallSignalDto callSignal)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        // Send to the specific user by their user ID as group name
        await Clients.Group(callSignal.CalleeId ?? string.Empty).SendAsync("ReceiveCallOffer", callSignal);
    }

    public async Task SendCallAnswer(CallSignalDto callSignal)
    {
        var callerId = callSignal.Caller?.Id;
        if (string.IsNullOrEmpty(callerId))
        {
            return;
        }

        await Clients.Group(callerId).SendAsync("ReceiveCallAnswer", callSignal);
    }

    public async Task SendIceCandidate(CallSignalDto callSignal)
    {
        var targetUserId = callSignal.CalleeId ?? callSignal.Caller?.Id;
        if (string.IsNullOrEmpty(targetUserId))
        {
            return;
        }

        await Clients.Group(targetUserId).SendAsync("ReceiveIceCandidate", callSignal);
    }

    public async Task EndCall(CallSignalDto callSignal)
    {
        var targetUserId = callSignal.CalleeId ?? callSignal.Caller?.Id;
        if (string.IsNullOrEmpty(targetUserId))
        {
            return;
        }

        await Clients.Group(targetUserId).SendAsync("CallEnded", callSignal);
    }
}
