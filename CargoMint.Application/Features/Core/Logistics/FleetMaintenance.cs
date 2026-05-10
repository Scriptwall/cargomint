using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record ToggleFleetMaintenanceCommand(int FleetId, bool UnderMaintenance, string? Reason, decimal? EstimatedCost) : IRequest<bool>;

public class FleetMaintenanceHandler(ICargoMintDbContext context) : IRequestHandler<ToggleFleetMaintenanceCommand, bool>
{
    public async Task<bool> Handle(ToggleFleetMaintenanceCommand request, CancellationToken cancellationToken)
    {
        var fleet = await context.Fleets.FindAsync([request.FleetId], cancellationToken);
        if (fleet == null) return false;

        fleet.IsUnderMaintenance = request.UnderMaintenance;

        if (request.UnderMaintenance)
        {
            context.MaintenanceLogs.Add(new MaintenanceLog
            {
                FleetId = fleet.Id,
                Description = request.Reason ?? "Regular Maintenance",
                Cost = request.EstimatedCost ?? 0,
                MaintenanceDate = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
