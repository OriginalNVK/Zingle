using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Zingle.API.DTOs;
using Zingle.API.Models;

namespace Zingle.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        UserManager<AppUser> userManager,
        ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _userManager.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.UserName ?? string.Empty,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                IsOnline = u.IsOnline,
                LastActive = u.LastActive,
                Bio = u.Bio
            })
            .ToListAsync();

        return users;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        var roles = await _userManager.GetRolesAsync(user);

        return new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            IsOnline = user.IsOnline,
            LastActive = user.LastActive,
            Bio = user.Bio,
            Role = roles.FirstOrDefault() ?? "User"
        };
    }

    [HttpPut("update-profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateUserDto updateDto)
    {
        var user = await _userManager.FindByIdAsync(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty);

        if (user == null)
        {
            return NotFound();
        }

        // Check if username is already taken
        if (!string.IsNullOrEmpty(updateDto.Username) && user.UserName != updateDto.Username)
        {
            var existingUser = await _userManager.FindByNameAsync(updateDto.Username);
            if (existingUser != null)
            {
                return BadRequest("Username is already taken");
            }

            user.UserName = updateDto.Username;
        }

        // Update other fields
        user.DisplayName = updateDto.DisplayName ?? user.DisplayName;
        user.Bio = updateDto.Bio ?? user.Bio;
        user.AvatarUrl = updateDto.AvatarUrl ?? user.AvatarUrl;

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        var roles = await _userManager.GetRolesAsync(user);

        return new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            IsOnline = user.IsOnline,
            LastActive = user.LastActive,
            Bio = user.Bio,
            Role = roles.FirstOrDefault() ?? "User"
        };
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
    {
        var user = await _userManager.FindByIdAsync(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty);

        if (user == null)
        {
            return NotFound();
        }

        if (changePasswordDto.NewPassword != changePasswordDto.ConfirmNewPassword)
        {
            return BadRequest("New passwords do not match");
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            changePasswordDto.CurrentPassword,
            changePasswordDto.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok();
    }
}
