using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Zingle.API.Data;
using Zingle.API.DTOs;
using Zingle.API.Models;

namespace Zingle.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CallsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<CallsController> _logger;

        public CallsController(
            ApplicationDbContext context,
            UserManager<AppUser> userManager,
            ILogger<CallsController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CallLogDto>>> GetCallHistory()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var callLogs = await _context.CallLogs
                .Include(c => c.Caller)
                .Include(c => c.Recipient)
                .Where(c => c.CallerId == userId || c.RecipientId == userId)
                .OrderByDescending(c => c.StartTime)
                .ToListAsync();

            return Ok(callLogs.Select(c => new CallLogDto
            {
                Id = c.Id,
                CallerId = c.CallerId,
                CallerName = c.Caller.DisplayName,
                CallerAvatarUrl = c.Caller.AvatarUrl,
                RecipientId = c.RecipientId,
                RecipientName = c.Recipient.DisplayName,
                RecipientAvatarUrl = c.Recipient.AvatarUrl,
                Type = c.Type,
                State = c.State,
                StartTime = c.StartTime,
                EndTime = c.EndTime,
                DurationSeconds = c.DurationSeconds
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CallLogDto>> GetCallLog(string id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var callLog = await _context.CallLogs
                .Include(c => c.Caller)
                .Include(c => c.Recipient)
                .FirstOrDefaultAsync(c => c.Id == id && (c.CallerId == userId || c.RecipientId == userId));

            if (callLog == null) return NotFound();

            return Ok(new CallLogDto
            {
                Id = callLog.Id,
                CallerId = callLog.CallerId,
                CallerName = callLog.Caller.DisplayName,
                CallerAvatarUrl = callLog.Caller.AvatarUrl,
                RecipientId = callLog.RecipientId,
                RecipientName = callLog.Recipient.DisplayName,
                RecipientAvatarUrl = callLog.Recipient.AvatarUrl,
                Type = callLog.Type,
                State = callLog.State,
                StartTime = callLog.StartTime,
                EndTime = callLog.EndTime,
                DurationSeconds = callLog.DurationSeconds
            });
        }

        [HttpPost]
        public async Task<ActionResult<CallLogDto>> CreateCallLog(CreateCallLogDto createCallLogDto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Verify caller is the current user
            if (createCallLogDto.CallerId != userId) return Forbid();

            // Verify recipient exists
            var recipient = await _userManager.FindByIdAsync(createCallLogDto.RecipientId);
            if (recipient == null) return BadRequest("Recipient not found");

            var callLog = new CallLog
            {
                Id = Guid.NewGuid().ToString(),
                CallerId = createCallLogDto.CallerId,
                RecipientId = createCallLogDto.RecipientId,
                Type = createCallLogDto.Type,
                State = createCallLogDto.State,
                StartTime = DateTime.UtcNow
            };

            _context.CallLogs.Add(callLog);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCallLog), new { id = callLog.Id }, new CallLogDto
            {
                Id = callLog.Id,
                CallerId = callLog.CallerId,
                RecipientId = callLog.RecipientId,
                Type = callLog.Type,
                State = callLog.State,
                StartTime = callLog.StartTime
            });
        }

        [HttpPut("{id}/end")]
        public async Task<IActionResult> EndCall(string id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var callLog = await _context.CallLogs
                .FirstOrDefaultAsync(c => c.Id == id && (c.CallerId == userId || c.RecipientId == userId));

            if (callLog == null) return NotFound();

            callLog.EndTime = DateTime.UtcNow;
            callLog.DurationSeconds = (int)(callLog.EndTime.Value - callLog.StartTime).TotalSeconds;
            callLog.State = CallState.Completed;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectCall(string id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var callLog = await _context.CallLogs
                .FirstOrDefaultAsync(c => c.Id == id && c.RecipientId == userId);

            if (callLog == null) return NotFound();

            callLog.EndTime = DateTime.UtcNow;
            callLog.State = CallState.Rejected;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/missed")]
        public async Task<IActionResult> MarkCallAsMissed(string id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var callLog = await _context.CallLogs
                .FirstOrDefaultAsync(c => c.Id == id && c.RecipientId == userId);

            if (callLog == null) return NotFound();

            callLog.EndTime = DateTime.UtcNow;
            callLog.State = CallState.Missed;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
