using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record CreateManifestCommand(
    int DepartureServiceCentreId,
    int DestinationServiceCentreId,
    int? FleetId,
    int? CaptainId = null,
    List<string>? Waybills = null,
    List<string>? GroupCodes = null) : IRequest<string>;

public class CreateManifestHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<CreateManifestCommand, string>
{
    public async Task<string> Handle(CreateManifestCommand request, CancellationToken cancellationToken)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0)
        {
            throw new InvalidOperationException("Manifest creation must happen inside a tenant workspace.");
        }

        var tenantId = tenantProvider.TenantId.Value;
        var departureExists = await context.ServiceCentres
            .AnyAsync(x => x.Id == request.DepartureServiceCentreId && x.TenantId == tenantId, cancellationToken);
        var destinationExists = await context.ServiceCentres
            .AnyAsync(x => x.Id == request.DestinationServiceCentreId && x.TenantId == tenantId, cancellationToken);
        if (!departureExists || !destinationExists)
        {
            throw new InvalidOperationException("Manifest service centres must belong to the active tenant.");
        }

        if (request.FleetId.HasValue)
        {
            var fleetExists = await context.Fleets
                .AnyAsync(x => x.Id == request.FleetId.Value && x.TenantId == tenantId, cancellationToken);
            if (!fleetExists)
            {
                throw new InvalidOperationException("Selected fleet is not available in this tenant.");
            }
        }

        if (request.CaptainId.HasValue)
        {
            var captainExists = await context.Captains
                .AnyAsync(x => x.Id == request.CaptainId.Value && x.TenantId == tenantId, cancellationToken);
            if (!captainExists)
            {
                throw new InvalidOperationException("Selected captain is not available in this tenant.");
            }
        }

        var code = $"MAN-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var manifest = new Manifest
        {
            ManifestCode = code,
            DepartureServiceCentreId = request.DepartureServiceCentreId,
            DestinationServiceCentreId = request.DestinationServiceCentreId,
            FleetId = request.FleetId,
            CaptainId = request.CaptainId,
            DateTime = DateTime.UtcNow,
            Status = ManifestStatus.Pending
        };

        // 1. Add loose shipments
        if (request.Waybills?.Any() == true)
        {
            var shipments = await context.Shipments
                .Where(s => s.TenantId == tenantId && request.Waybills.Contains(s.Waybill))
                .ToListAsync(cancellationToken);

            foreach (var ship in shipments)
            {
                if (ship.Status is not ShipmentScanStatus.ReadyForManifest)
                {
                    throw new InvalidOperationException($"Shipment {ship.Waybill} is not ready for manifest.");
                }

                ship.Status = ShipmentScanStatus.Manifested;
                manifest.Items.Add(new ManifestItem
                {
                    ShipmentId = ship.Id,
                    WaybillOrGroupCode = ship.Waybill
                });
            }
        }

        // 2. Add consolidated groups
        if (request.GroupCodes?.Any() == true)
        {
            var groups = await context.ShipmentGroups
                .Where(g => g.TenantId == tenantId && request.GroupCodes.Contains(g.GroupCode))
                .Select(g => new { g.Id, g.GroupCode })
                .ToListAsync(cancellationToken);

            foreach (var group in groups)
            {
                manifest.Items.Add(new ManifestItem
                {
                    ShipmentGroupId = group.Id,
                    WaybillOrGroupCode = group.GroupCode
                });
            }
        }

        context.Manifests.Add(manifest);
        await context.SaveChangesAsync(cancellationToken);

        return code;
    }
}
