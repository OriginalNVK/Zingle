using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Zingle.API.DTOs;
using Zingle.API.Models;
using Zingle.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Zingle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        TokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);

        if (user == null)
        {
            return Unauthorized("Invalid email or password");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

        if (!result.Succeeded)
        {
            return Unauthorized("Invalid email or password");
        }

        // Update online status
        user.IsOnline = true;
        user.LastActive = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        var userDto = await CreateUserDto(user);
        
        // Let the CORS middleware handle the headers
        return userDto;
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
    {
        if (await _userManager.FindByEmailAsync(registerDto.Email) != null)
        {
            return BadRequest("Email is already registered");
        }

        if (await _userManager.FindByNameAsync(registerDto.Username) != null)
        {
            return BadRequest("Username is already taken");
        }

        var user = new AppUser
        {
            Email = registerDto.Email,
            UserName = registerDto.Username,
            DisplayName = registerDto.DisplayName ?? registerDto.Username,
            AvatarUrl = $"https://api.dicebear.com/6.x/initials/svg?seed={registerDto.Username}",
            IsOnline = true,
            LastActive = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }
        
        // Add to default role
        await _userManager.AddToRoleAsync(user, "User");

        var userDto = await CreateUserDto(user);
        
        // Set proper CORS headers for the response
        HttpContext.Response.Headers["Access-Control-Allow-Origin"] = 
            Request.Headers["Origin"].ToString();
        HttpContext.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            
        return userDto;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        
        if (user == null)
        {
            return NotFound();
        }

        var userDto = await CreateUserDto(user);
        return userDto;
    }

    private async Task<UserDto> CreateUserDto(AppUser user)
    {
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
            Token = _tokenService.CreateToken(user),
            Role = roles.FirstOrDefault() ?? "User"
        };
    }
}
