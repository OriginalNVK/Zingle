using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Zingle.API.Models;
using Microsoft.Extensions.Configuration;

namespace Zingle.API.Services;

public class TokenService
{    private readonly IConfiguration _config;
    private readonly SymmetricSecurityKey _key; 
    
    public TokenService(IConfiguration config)
    {
        _config = config;
        string tokenKey = _config["JwtSettings:TokenKey"] ?? 
            throw new InvalidOperationException("JWT Token Key not found in configuration");
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));
    }

    public string CreateToken(AppUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty)
        };

        if (!string.IsNullOrEmpty(user.DisplayName))
            claims.Add(new Claim("displayName", user.DisplayName));

        var roles = new[] { "User" }; // Replace with actual roles from user

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var credentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(_config["JwtSettings:TokenExpiry"] ?? "7")),
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
