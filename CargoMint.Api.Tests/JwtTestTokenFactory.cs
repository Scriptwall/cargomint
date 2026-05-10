using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace CargoMint.Api.Tests;

internal static class JwtTestTokenFactory
{
    private const string Secret = "A_Very_Long_And_Secure_Secret_Key_For_CargoMint_2026";
    private const string Issuer = "CargoMint";
    private const string Audience = "CargoMint.Users";

    public static string CreateToken(string role, int tenantId = 1)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, "test@cargomint.com"),
            new(ClaimTypes.Name, "test@cargomint.com"),
            new("tenantId", tenantId.ToString()),
            new("userType", "SystemUser"),
            new(ClaimTypes.Role, role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
