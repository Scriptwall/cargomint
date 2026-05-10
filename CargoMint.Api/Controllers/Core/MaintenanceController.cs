using CargoMint.Domain.Entities.Core;

using CargoMint.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[ApiController]
[Route("api/v1/[controller]")]
public class MaintenanceController(
    CargoMintDbContext context,
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager,
    IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("reset-admin-only")]
    public async Task<IActionResult> ResetAdminOnly()
    {
        if (!environment.IsDevelopment())
        {
            return Forbid();
        }

        await CargoMintDbInitializer.ResetToAdminOnlyAsync(context, userManager, roleManager);
        return Ok(new
        {
            message = "Database reset completed. Tenant and shipment/financial operational data removed. Admin users reseeded."
        });
    }
}
