using CargoMint.Application.Features.Core.Shipments;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using CargoMint.Domain.Entities.Core;

using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record ActiveTripStopDto(
    string Waybill,
    string ReceiverName,
    string? ReceiverAddress,
    string? ReceiverPhone,
    int SequenceNo,
    string Status);

public record GetActiveTripQuery(int CaptainId) : IRequest<List<ActiveTripStopDto>>;

public class GetActiveTripHandler(ICargoMintDbContext context)
    : IRequestHandler<GetActiveTripQuery, List<ActiveTripStopDto>>
{
    public async Task<List<ActiveTripStopDto>> Handle(
        GetActiveTripQuery request, CancellationToken cancellationToken)
    {
        // Find the most recently dispatched manifest assigned to this captain
        var manifest = await context.Manifests
            .AsNoTracking()
            .Where(m => m.CaptainId == request.CaptainId &&
                        m.IsDispatched &&
                        !m.IsReceived &&
                        m.Status != ManifestStatus.Cancelled)
            .OrderByDescending(m => m.DateTime)
            .FirstOrDefaultAsync(cancellationToken);

        if (manifest == null) return [];

        // Pull shipments from that manifest, ordered alphabetically by waybill (Phase 1 ordering)
        var stops = await context.ManifestItems
            .AsNoTracking()
            .Include(mi => mi.Shipment)
            .Where(mi => mi.ManifestId == manifest.Id && mi.Shipment != null)
            .OrderBy(mi => mi.Shipment!.Waybill)
            .Select(mi => new ActiveTripStopDto(
                mi.Shipment!.Waybill,
                mi.Shipment.ReceiverName,
                mi.Shipment.ReceiverAddress,
                mi.Shipment.ReceiverPhoneNumber,
                0, // sequence index applied after
                mi.Shipment.Status.ToString()))
            .ToListAsync(cancellationToken);

        // Apply sequence numbers in-memory after sort
        return stops
            .Select((s, i) => s with { SequenceNo = i + 1 })
            .ToList();
    }
}

