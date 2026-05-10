using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CargoMint.Application.Features.Core.Account;

public record RegisterRequest(
    string Email, 
    string Password, 
    string FirstName, 
    string LastName,
    UserType UserType = UserType.Regular) : IRequest<bool>;

public class RegisterHandler(UserManager<ApplicationUser> userManager) : IRequestHandler<RegisterRequest, bool>
{
    public async Task<bool> Handle(RegisterRequest request, CancellationToken cancellationToken)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            UserType = request.UserType,
            IsActive = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return false;
        }

        var role = request.UserType switch
        {
            UserType.Partner => "Partner",
            UserType.SystemUser => "Captain",
            _ => "Customer"
        };

        await userManager.AddToRoleAsync(user, role);
        return true;
    }
}
