using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Zingle.API.DTOs;
using Zingle.API.Models;
using System.Security.Claims;
using Zingle.API.Data;

namespace Zingle.API.Hubs;

[Authorize]
public class CallHub : Hub
{
    private readonly ILogger<CallHub> _logger;
    private readonly ApplicationDbContext _context;

    public CallHub(ILogger<CallHub> logger, ApplicationDbContext context)
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
            _logger.LogInformation("User {UserId} connected to CallHub", userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation("User {UserId} disconnected from CallHub", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    // Call signaling methods
    public async Task InitiateCall(CallSignalDto callSignal)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(callSignal.CalleeId))
        {
            return;
        }

        var callType = callSignal.CallType?.ToLower();
        var isVideoCall = callType == "video";

        // Create a call log
        var callLog = new CallLog
        {
            Id = callSignal.CallId,
            CallerId = userId,
            RecipientId = callSignal.CalleeId,
            Type = isVideoCall ? CallType.Video : CallType.Audio,
            State = CallState.Initiated,
            StartTime = DateTime.UtcNow
        };

        try
        {
            _context.CallLogs.Add(callLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Call initiated: {CallId} from {CallerId} to {CalleeId}",
                callSignal.CallId, userId, callSignal.CalleeId);

            // Get caller details for the recipient
            var caller = await _context.Users.FindAsync(userId);

            // Send the call request to the callee
            await Clients.Group(callSignal.CalleeId).SendAsync("ReceiveCallOffer", new CallSignalDto
            {
                CallId = callSignal.CallId,
                CallType = callSignal.CallType,
                Caller = new UserDto
                {
                    Id = userId,
                    Username = caller?.UserName ?? string.Empty,
                    DisplayName = caller?.DisplayName ?? string.Empty,
                    AvatarUrl = caller?.AvatarUrl ?? string.Empty
                },
                CalleeId = callSignal.CalleeId,
                Signal = "offer",
                Data = callSignal.Data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating call");
        }
    }

    public async Task SendCallAnswer(CallSignalDto callSignal)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(callSignal.CallId))
        {
            return;
        }

        try
        {
            // Update call state to active
            var callLog = await _context.CallLogs.FindAsync(callSignal.CallId);
            if (callLog != null && callLog.RecipientId == userId)
            {
                callLog.State = CallState.Active;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Call answered: {CallId} by {UserId}",
                    callSignal.CallId, userId);
            }

            // Get user details
            var user = await _context.Users.FindAsync(userId);

            // Send the answer to the caller
            await Clients.Group(callSignal.Caller?.Id ?? string.Empty).SendAsync("ReceiveCallAnswer", new CallSignalDto
            {
                CallId = callSignal.CallId,
                CallType = callSignal.CallType,
                Caller = callSignal.Caller,
                CalleeId = userId,
                Signal = "answer",
                Data = callSignal.Data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error answering call");
        }
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

    public async Task RejectCall(string callId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(callId))
        {
            return;
        }

        try
        {
            // Update call state to rejected
            var callLog = await _context.CallLogs.FindAsync(callId);
            if (callLog != null && callLog.RecipientId == userId)
            {
                callLog.State = CallState.Rejected;
                callLog.EndTime = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Call rejected: {CallId} by {UserId}",
                    callId, userId);

                // Notify the caller that the call was rejected
                await Clients.Group(callLog.CallerId).SendAsync("CallRejected", new
                {
                    CallId = callId,
                    RejecterId = userId
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting call");
        }
    }

    public async Task EndCall(string callId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(callId))
        {
            return;
        }

        try
        {
            // Update call state to completed
            var callLog = await _context.CallLogs.FindAsync(callId);
            if (callLog != null && (callLog.CallerId == userId || callLog.RecipientId == userId))
            {
                callLog.State = CallState.Completed;
                callLog.EndTime = DateTime.UtcNow;
                callLog.DurationSeconds = (int)(callLog.EndTime.Value - callLog.StartTime).TotalSeconds;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Call ended: {CallId} by {UserId}",
                    callId, userId);

                // Notify the other participant that the call has ended
                var targetUserId = callLog.CallerId == userId ? callLog.RecipientId : callLog.CallerId;

                await Clients.Group(targetUserId).SendAsync("CallEnded", new
                {
                    CallId = callId,
                    EndedBy = userId,
                    Duration = callLog.DurationSeconds
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending call");
        }
    }

    public async Task MissedCall(string callId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(callId))
        {
            return;
        }

        try
        {
            // Update call state to missed
            var callLog = await _context.CallLogs.FindAsync(callId);
            if (callLog != null && callLog.CallerId == userId)
            {
                callLog.State = CallState.Missed;
                callLog.EndTime = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Call marked as missed: {CallId}", callId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking call as missed");
        }
    }
}
