using CargoMint.Domain.Entities.Core;

using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Text.Json;

namespace CargoMint.Application.Features.Core.Account;

public record ChangePasswordCommand(
    int UserId,
    string CurrentPassword,
    string NewPassword) : IRequest<bool>;

public class ChangePasswordHandler(
    UserManager<ApplicationUser> userManager,
    ICargoMintDbContext context)
    : IRequestHandler<ChangePasswordCommand, bool>
{
    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
        {
            return false;
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return false;
        }

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            user.LastModifiedAt = DateTime.UtcNow;
            await userManager.UpdateAsync(user);

            // AuditLog handled by enterprise version
            // if (user.TenantId > 0)
            // {
            //     await context.AuditLogs.AddAsync(new AuditLog
            //     {
            //         TenantId = user.TenantId,
            //         TableName = "TenantInvitation",
            //         EntityId = user.TenantId.ToString(),
            //         Action = "InviteAccepted",
            //         NewValues = JsonSerializer.Serialize(new
            //         {
            //             Email = user.Email,
            //             Accepted = true,
            //             AcceptedAtUtc = DateTime.UtcNow
            //         }),
            //         UserId = user.Id.ToString()
            //     }, cancellationToken);
            //     await context.SaveChangesAsync(cancellationToken);
            // }
        }

        return true;
    }
}
