using CargoMint.Domain.Entities.Core;

using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CargoMint.Application.Features.Core.Account;

public record LoginRequest(string Email, string Password) : IRequest<LoginResponse?>;

public record LoginResponse(
    string Token,
    string Email,
    string FirstName,
    string LastName,
    string UserType,
    int TenantId,
    IList<string> Roles,
    int? AssignedServiceCentreId,
    bool MustChangePassword);

public class LoginHandler(
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration) : IRequestHandler<LoginRequest, LoginResponse?>
{
    public async Task<LoginResponse?> Handle(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = (request.Email ?? string.Empty).Trim();
        var password = (request.Password ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var user = await userManager.FindByEmailAsync(email);
        
        if (user == null || !await userManager.CheckPasswordAsync(user, password))
        {
            return null;
        }

        if (user.IsLoginRestricted)
        {
            throw new UnauthorizedAccessException("Your login access has been restricted. Contact your admin.");
        }
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Your account is inactive. Contact your admin.");
        }

        var roles = await userManager.GetRolesAsync(user);
        if (roles.Contains("TenantAdmin") && user.TenantId <= 0)
        {
            throw new UnauthorizedAccessException("Tenant admin account is not linked to a tenant workspace.");
        }

        var token = GenerateJwtToken(user, roles);

        return new LoginResponse(
            token,
            user.Email!,
            user.FirstName,
            user.LastName,
            user.UserType.ToString(),
            user.TenantId,
            roles,
            user.AssignedServiceCentreId,
            !user.EmailConfirmed
        );
    }

    private string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.Email!),
            new("fullName", user.FullName),
            new("tenantId", user.TenantId.ToString()),
            new("userType", user.UserType.ToString())
        };
        
        if (user.AssignedServiceCentreId.HasValue)
        {
            claims.Add(new Claim("assignedServiceCentreId", user.AssignedServiceCentreId.Value.ToString()));
        }

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(secretKey);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(Convert.ToDouble(jwtSettings["ExpiryInMinutes"])),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
