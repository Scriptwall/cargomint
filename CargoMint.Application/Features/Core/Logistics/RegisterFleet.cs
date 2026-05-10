using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record RegisterFleetCommand(
    string RegistrationNumber, 
    FleetType Type, 
    int Capacity, 
    string? Description) : IRequest<int>;

public class RegisterFleetHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<RegisterFleetCommand, int>
{
    public async Task<int> Handle(RegisterFleetCommand request, CancellationToken cancellationToken)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0)
        {
            throw new InvalidOperationException("Fleet must be created inside a tenant workspace.");
        }

        var tenantId = tenantProvider.TenantId.Value;
        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            throw new InvalidOperationException("Tenant not found for fleet registration.");
        }

        if (tenant.OperationalType is not (TenantOperationalType.Logistics or TenantOperationalType.Fleet))
        {
            throw new InvalidOperationException("Only logistics or fleet tenants can own fleets.");
        }

        var registrationNumber = request.RegistrationNumber?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(registrationNumber))
        {
            throw new InvalidOperationException("Registration number is required.");
        }

        var exists = await context.Fleets
            .AnyAsync(x => x.TenantId == tenantId && x.RegistrationNumber == registrationNumber, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("A fleet with this registration number already exists in this tenant.");
        }

        var fleet = new Fleet
        {
            TenantId = tenantId,
            RegistrationNumber = registrationNumber,
            FleetType = request.Type,
            Capacity = request.Capacity,
            Description = request.Description
        };

        context.Fleets.Add(fleet);
        await context.SaveChangesAsync(cancellationToken);

        return fleet.Id;
    }
}
