using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Zingle.API.Data;
using Zingle.API.DTOs;
using Zingle.API.Models;

namespace Zingle.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            ApplicationDbContext context,
            UserManager<AppUser> userManager,
            ILogger<AdminController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetAllUsers()
        {
            var users = await _userManager.Users
                .Select(u => new AdminUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    DisplayName = u.DisplayName,
                    IsOnline = u.IsOnline,
                    LastActive = u.LastActive,
                    CreatedAt = u.CreatedAt,
                    Bio = u.Bio,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();

            // Add role information
            foreach (var user in users)
            {
                var appUser = await _userManager.FindByIdAsync(user.Id);
                if (appUser != null)
                {
                    user.Roles = await _userManager.GetRolesAsync(appUser);
                }
            }

            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<ActionResult<AdminUserDto>> GetUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var userDto = new AdminUserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                DisplayName = user.DisplayName,
                IsOnline = user.IsOnline,
                LastActive = user.LastActive,
                CreatedAt = user.CreatedAt,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                Roles = await _userManager.GetRolesAsync(user)
            };

            return Ok(userDto);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, UpdateUserDto updateDto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            // Update user properties
            user.DisplayName = updateDto.DisplayName ?? user.DisplayName;
            user.Bio = updateDto.Bio ?? user.Bio;

            if (!string.IsNullOrEmpty(updateDto.AvatarUrl))
            {
                user.AvatarUrl = updateDto.AvatarUrl;
            }

            // Save changes to user
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpPut("users/{id}/change-role")]
        public async Task<IActionResult> ChangeUserRole(string id, [FromBody] ChangeRoleDto changeRoleDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound("User not found");

            // Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);

            // Remove current roles
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return BadRequest(removeResult.Errors);
            }

            // Add new role
            var addResult = await _userManager.AddToRoleAsync(user, changeRoleDto.Role);
            if (!addResult.Succeeded)
            {
                return BadRequest(addResult.Errors);
            }

            return NoContent();
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            // Delete associated data first
            var chats = await _context.Chats
                .Where(c => c.Participants.Any(p => p.UserId == id))
                .ToListAsync();

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpGet("stats")]
        public async Task<ActionResult<AdminStatsDto>> GetStats()
        {
            var stats = new AdminStatsDto
            {
                TotalUsers = await _userManager.Users.CountAsync(),
                OnlineUsers = await _userManager.Users.CountAsync(u => u.IsOnline),
                TotalChats = await _context.Chats.CountAsync(),
                GroupChats = await _context.Chats.CountAsync(c => c.IsGroupChat),
                DirectChats = await _context.Chats.CountAsync(c => !c.IsGroupChat),
                TotalMessages = await _context.Messages.CountAsync(),
                MessagesToday = await _context.Messages.CountAsync(m => m.Timestamp.Date == DateTime.UtcNow.Date)
            };

            return Ok(stats);
        }
    }
}
