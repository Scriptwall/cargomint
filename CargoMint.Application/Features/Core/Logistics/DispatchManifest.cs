using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record DispatchManifestCommand(
    int FleetId, 
    int CaptainId, 
    List<int> ManifestIds) : IRequest<TripResult>;

public class DispatchManifestHandler(
    IFleetProvider fleetProvider,
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<DispatchManifestCommand, TripResult>
{
    public async Task<TripResult> Handle(DispatchManifestCommand request, CancellationToken cancellationToken)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0)
        {
            return new TripResult(false, string.Empty, "Dispatch must happen inside a tenant workspace.");
        }

        var tenantId = tenantProvider.TenantId.Value;
        var fleetExists = await context.Fleets
            .AsNoTracking()
            .AnyAsync(f => f.Id == request.FleetId && f.TenantId == tenantId, cancellationToken);
        if (!fleetExists)
        {
            return new TripResult(false, string.Empty, "Selected fleet is not available in this tenant.");
        }

        // 1. Compliance Block
        var captain = await context.Captains
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CaptainId && c.TenantId == tenantId, cancellationToken);

        if (captain is null)
        {
            return new TripResult(false, string.Empty, "Selected captain is not available in this tenant.");
        }
            
        if (captain is { IsComplianceLocked: true })
        {
            return new TripResult(false, string.Empty, 
                $"Dispatch blocked: Captain is locked due to compliance ({captain.ComplianceLockReason ?? "Unknown"}).");
        }

        var manifests = await context.Manifests
            .AsNoTracking()
            .Where(m => request.ManifestIds.Contains(m.Id) && m.TenantId == tenantId)
            .Select(m => new { m.Id, m.Status, m.IsDispatched, m.IsReceived })
            .ToListAsync(cancellationToken);

        if (manifests.Count != request.ManifestIds.Count)
        {
            return new TripResult(false, string.Empty, "One or more manifests are unavailable in this tenant.");
        }

        if (manifests.Any(m => m.Status != CargoMint.Domain.Entities.Core.ManifestStatus.Pending || m.IsDispatched || m.IsReceived))
        {
            return new TripResult(false, string.Empty, "Only pending manifests can be dispatched.");
        }

        // 2. Dispatch
        // This handler is now agnostic of whether we use an internal or external fleet!
        return await fleetProvider.DispatchTrip(request.FleetId, request.CaptainId, request.ManifestIds);
    }
}
