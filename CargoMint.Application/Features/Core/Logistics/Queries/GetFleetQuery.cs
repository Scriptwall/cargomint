using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics.Queries;

public record FleetVehicleDto(
    int Id,
    string Plate,
    string Type,
    string Cap,
    string Status,
    string Trip,
    string Fuel,
    string Driver
);

public record GetFleetQuery : IRequest<List<FleetVehicleDto>>;

public class GetFleetHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetFleetQuery, List<FleetVehicleDto>>
{
    public async Task<List<FleetVehicleDto>> Handle(GetFleetQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId ?? 0;

        var vehicles = await context.Fleets
            .Include(f => f.AssignedCaptain).ThenInclude(c => c.User)
            .Where(f => f.TenantId == tenantId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        return vehicles.Select(f => new FleetVehicleDto(
            f.Id,
            f.RegistrationNumber,
            f.FleetType.ToString(),
            $"{f.Capacity}kg",
            f.IsUnderMaintenance ? "Maintenance" : (f.IsActive ? "Available" : "Inactive"),
            "—", // Trip info would come from active FleetTrips
            "80%", // Placeholder for telematics
            f.AssignedCaptain?.User != null ? $"{f.AssignedCaptain.User.FirstName} {f.AssignedCaptain.User.LastName}" : "Unassigned"
        )).ToList();
    }
}
