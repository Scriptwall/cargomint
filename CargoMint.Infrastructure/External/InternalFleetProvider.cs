using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Infrastructure.External;

public class InternalFleetProvider(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IFleetProvider
{
    public async Task<TripResult> DispatchTrip(int fleetId, int captainId, List<int> manifestIds)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0)
        {
            return new TripResult(false, string.Empty, "Dispatch must happen inside a tenant workspace.");
        }

        var tenantId = tenantProvider.TenantId.Value;
        var fleetExists = await context.Fleets
            .AnyAsync(f => f.Id == fleetId && f.TenantId == tenantId);
        if (!fleetExists)
        {
            return new TripResult(false, string.Empty, "Fleet not found for this tenant.");
        }

        var captainExists = await context.Captains
            .AnyAsync(c => c.Id == captainId && c.TenantId == tenantId);
        if (!captainExists)
        {
            return new TripResult(false, string.Empty, "Captain not found for this tenant.");
        }

        // 1. Generate Trip Code
        var code = $"TRIP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        // 2. Create the Trip
        var trip = new FleetTrip
        {
            TripCode = code,
            FleetId = fleetId,
            CaptainId = captainId,
            DepartureTime = DateTime.UtcNow
        };

        // 3. Link manifests and update status
        var manifests = await context.Manifests
            .Where(m => m.TenantId == tenantId && manifestIds.Contains(m.Id))
            .ToListAsync();
        if (manifests.Count != manifestIds.Count)
        {
            return new TripResult(false, string.Empty, "One or more manifests are unavailable for this tenant.");
        }

        foreach (var m in manifests)
        {
            if (m.IsDispatched || m.IsReceived || m.Status != ManifestStatus.Pending)
            {
                return new TripResult(false, string.Empty, $"Manifest {m.ManifestCode} is not pending for dispatch.");
            }

            m.FleetId = fleetId;
            m.CaptainId = captainId;
            m.FleetTrip = trip;
            m.IsDispatched = true;
            m.Status = ManifestStatus.Dispatched;

            // Update all shipments in the manifest
            var shipmentIds = await context.ManifestItems
                .Where(mi => mi.ManifestId == m.Id && mi.ShipmentId.HasValue)
                .Select(mi => mi.ShipmentId!.Value)
                .ToListAsync();

            var shipments = await context.Shipments
                .Where(s => shipmentIds.Contains(s.Id))
                .ToListAsync();

            foreach (var ship in shipments)
            {
                ship.Status = ShipmentScanStatus.OutForDelivery;
            }
        }

        context.FleetTrips.Add(trip);
        await context.SaveChangesAsync();

        return new TripResult(true, code, "Internal trip dispatched successfully.");
    }

    public async Task<TripStatus> GetTripStatus(string tripReference)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0)
        {
            return TripStatus.Cancelled;
        }

        var tenantId = tenantProvider.TenantId.Value;
        var trip = await context.FleetTrips
            .FirstOrDefaultAsync(t => t.TripCode == tripReference && t.TenantId == tenantId);

        if (trip == null) return TripStatus.Cancelled;
        
        return trip.ArrivalTime.HasValue ? TripStatus.Arrived : TripStatus.InTransit;
    }
}
