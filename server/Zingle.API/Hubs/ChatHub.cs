using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Zingle.API.DTOs;
using System.Security.Claims;

namespace Zingle.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
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

        // In a real implementation, we would save the message to the database
        // and then broadcast it to the recipients

        // For now, just broadcast to the chat group
        await Clients.Group(messageDto.ChatId).SendAsync("ReceiveMessage", new
        {
            Id = Guid.NewGuid().ToString(),
            messageDto.ChatId,
            SenderId = userId,
            SenderUsername = Context.User?.FindFirstValue(ClaimTypes.Name) ?? "Unknown",
            messageDto.Content,
            Timestamp = DateTime.UtcNow,
            messageDto.Type,
            messageDto.ImageUrl,
            messageDto.FileUrl,
            messageDto.FileName,
            messageDto.FileSize,
            IsRead = false,
            Status = "sent"
        });
    }
    public async Task SendTypingIndicator(string chatId, bool isTyping)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
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
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
        _logger.LogInformation("User {UserId} joined chat {ChatId}",
            Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), chatId);
    }

    public async Task LeaveChat(string chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
        _logger.LogInformation("User {UserId} left chat {ChatId}",
            Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), chatId);
    }

    public async Task MarkMessageAsRead(string chatId, string messageId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        // In a real implementation, update the database to mark this message as read

        // Notify other users in the chat that the current user has read the message
        await Clients.GroupExcept(chatId, Context.ConnectionId).SendAsync("MessageRead", new
        {
            ChatId = chatId,
            MessageId = messageId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        });
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
