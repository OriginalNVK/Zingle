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
public class FriendsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly ILogger<FriendsController> _logger;

    public FriendsController(
        ApplicationDbContext context,
        UserManager<AppUser> userManager,
        ILogger<FriendsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<FriendshipDto>>> GetFriends()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var friendships = await _context.Friendships
            .Where(f => f.User1Id == userId || f.User2Id == userId)
            .Include(f => f.User1)
            .Include(f => f.User2)
            .ToListAsync();

        var friendshipDtos = friendships.Select(f =>
        {
            var friend = f.User1Id == userId ? f.User2 : f.User1;
            return new FriendshipDto
            {
                Id = f.Id,
                Friend = new UserDto
                {
                    Id = friend.Id,
                    Username = friend.UserName ?? string.Empty,
                    DisplayName = friend.DisplayName,
                    AvatarUrl = friend.AvatarUrl,
                    IsOnline = friend.IsOnline,
                    LastActive = friend.LastActive,
                    Bio = friend.Bio
                },
                CreatedAt = f.CreatedAt
            };
        }).ToList();

        return friendshipDtos;
    }

    [HttpGet("requests")]
    public async Task<ActionResult<List<FriendRequestDto>>> GetFriendRequests()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var requests = await _context.FriendRequests
            .Where(fr => fr.ToUserId == userId && fr.Status == FriendRequestStatus.Pending)
            .Include(fr => fr.FromUser)
            .Include(fr => fr.ToUser)
            .ToListAsync();

        var requestDtos = requests.Select(fr => new FriendRequestDto
        {
            Id = fr.Id,
            FromUser = new UserDto
            {
                Id = fr.FromUser.Id,
                Username = fr.FromUser.UserName ?? string.Empty,
                DisplayName = fr.FromUser.DisplayName,
                AvatarUrl = fr.FromUser.AvatarUrl,
                IsOnline = fr.FromUser.IsOnline,
                LastActive = fr.FromUser.LastActive,
                Bio = fr.FromUser.Bio
            },
            ToUser = new UserDto
            {
                Id = fr.ToUser.Id,
                Username = fr.ToUser.UserName ?? string.Empty,
                DisplayName = fr.ToUser.DisplayName
            },
            Status = fr.Status.ToString(),
            CreatedAt = fr.CreatedAt,
            RespondedAt = fr.RespondedAt
        }).ToList();

        return requestDtos;
    }

    [HttpPost("requests")]
    public async Task<ActionResult<FriendRequestDto>> CreateFriendRequest(CreateFriendRequestDto createRequestDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (userId == createRequestDto.ToUserId)
        {
            return BadRequest("You cannot send a friend request to yourself");
        }

        // Check if users already have a friendship
        var existingFriendship = await _context.Friendships
            .AnyAsync(f =>
                (f.User1Id == userId && f.User2Id == createRequestDto.ToUserId) ||
                (f.User1Id == createRequestDto.ToUserId && f.User2Id == userId));

        if (existingFriendship)
        {
            return BadRequest("You are already friends with this user");
        }

        // Check if there's already a pending request
        var existingRequest = await _context.FriendRequests
            .FirstOrDefaultAsync(fr =>
                fr.FromUserId == userId &&
                fr.ToUserId == createRequestDto.ToUserId &&
                fr.Status == FriendRequestStatus.Pending);

        if (existingRequest != null)
        {
            return BadRequest("You already have a pending friend request to this user");
        }

        // Check if there's a pending request from the other user
        var reverseRequest = await _context.FriendRequests
            .FirstOrDefaultAsync(fr =>
                fr.FromUserId == createRequestDto.ToUserId &&
                fr.ToUserId == userId &&
                fr.Status == FriendRequestStatus.Pending);

        if (reverseRequest != null)
        {
            // Auto-accept the reverse request instead of creating a new one
            reverseRequest.Status = FriendRequestStatus.Accepted;
            reverseRequest.RespondedAt = DateTime.UtcNow;

            // Create friendship
            var friendship = new Friendship
            {
                User1Id = reverseRequest.FromUserId,
                User2Id = reverseRequest.ToUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            // Return the accepted request
            await _context.Entry(reverseRequest)
                .Reference(fr => fr.FromUser)
                .LoadAsync();

            await _context.Entry(reverseRequest)
                .Reference(fr => fr.ToUser)
                .LoadAsync();

            return new FriendRequestDto
            {
                Id = reverseRequest.Id,
                FromUser = new UserDto
                {
                    Id = reverseRequest.FromUser.Id,
                    Username = reverseRequest.FromUser.UserName ?? string.Empty,
                    DisplayName = reverseRequest.FromUser.DisplayName,
                    AvatarUrl = reverseRequest.FromUser.AvatarUrl,
                    IsOnline = reverseRequest.FromUser.IsOnline,
                    Bio = reverseRequest.FromUser.Bio
                },
                ToUser = new UserDto
                {
                    Id = reverseRequest.ToUser.Id,
                    Username = reverseRequest.ToUser.UserName ?? string.Empty,
                    DisplayName = reverseRequest.ToUser.DisplayName
                },
                Status = reverseRequest.Status.ToString(),
                CreatedAt = reverseRequest.CreatedAt,
                RespondedAt = reverseRequest.RespondedAt
            };
        }

        // Create new friend request
        var request = new FriendRequest
        {
            FromUserId = userId,
            ToUserId = createRequestDto.ToUserId,
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.FriendRequests.Add(request);
        await _context.SaveChangesAsync();

        // Load related entities for return
        await _context.Entry(request)
            .Reference(fr => fr.FromUser)
            .LoadAsync();

        await _context.Entry(request)
            .Reference(fr => fr.ToUser)
            .LoadAsync();

        return new FriendRequestDto
        {
            Id = request.Id,
            FromUser = new UserDto
            {
                Id = request.FromUser.Id,
                Username = request.FromUser.UserName ?? string.Empty,
                DisplayName = request.FromUser.DisplayName,
                AvatarUrl = request.FromUser.AvatarUrl,
                IsOnline = request.FromUser.IsOnline,
                Bio = request.FromUser.Bio
            },
            ToUser = new UserDto
            {
                Id = request.ToUser.Id,
                Username = request.ToUser.UserName ?? string.Empty,
                DisplayName = request.ToUser.DisplayName
            },
            Status = request.Status.ToString(),
            CreatedAt = request.CreatedAt,
            RespondedAt = request.RespondedAt
        };
    }

    [HttpPost("requests/{id}/accept")]
    public async Task<ActionResult<FriendshipDto>> AcceptFriendRequest(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var request = await _context.FriendRequests
            .Include(fr => fr.FromUser)
            .Include(fr => fr.ToUser)
            .FirstOrDefaultAsync(fr => fr.Id == id && fr.ToUserId == userId);

        if (request == null)
        {
            return NotFound();
        }

        if (request.Status != FriendRequestStatus.Pending)
        {
            return BadRequest("This friend request has already been processed");
        }

        // Update request status
        request.Status = FriendRequestStatus.Accepted;
        request.RespondedAt = DateTime.UtcNow;

        // Create friendship
        var friendship = new Friendship
        {
            User1Id = request.FromUserId,
            User2Id = request.ToUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Return the new friendship
        await _context.Entry(friendship)
            .Reference(f => f.User1)
            .LoadAsync();

        await _context.Entry(friendship)
            .Reference(f => f.User2)
            .LoadAsync();

        var friend = request.FromUser;

        return new FriendshipDto
        {
            Id = friendship.Id,
            Friend = new UserDto
            {
                Id = friend.Id,
                Username = friend.UserName ?? string.Empty,
                DisplayName = friend.DisplayName,
                AvatarUrl = friend.AvatarUrl,
                IsOnline = friend.IsOnline,
                LastActive = friend.LastActive,
                Bio = friend.Bio
            },
            CreatedAt = friendship.CreatedAt
        };
    }

    [HttpPost("requests/{id}/decline")]
    public async Task<IActionResult> DeclineFriendRequest(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var request = await _context.FriendRequests
            .FirstOrDefaultAsync(fr => fr.Id == id && fr.ToUserId == userId);

        if (request == null)
        {
            return NotFound();
        }

        if (request.Status != FriendRequestStatus.Pending)
        {
            return BadRequest("This friend request has already been processed");
        }

        // Update request status
        request.Status = FriendRequestStatus.Declined;
        request.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveFriend(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == id && (f.User1Id == userId || f.User2Id == userId));

        if (friendship == null)
        {
            return NotFound();
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();

        return Ok();
    }
}
