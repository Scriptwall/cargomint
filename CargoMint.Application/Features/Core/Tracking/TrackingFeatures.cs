using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Tracking;

public record AddTrackingScanCommand(string Waybill, string Location, string Status) : IRequest<bool>;
public record GetTrackingHistoryQuery(string Waybill) : IRequest<List<ShipmentTracking>>;
public record PublicTrackingMilestoneDto(string Name, bool Completed, DateTime? Timestamp, string? Location);
public record PublicTrackingTimelineDto(
    string Waybill,
    string CurrentStatus,
    IReadOnlyList<PublicTrackingMilestoneDto> Timeline);
public record GetPublicTrackingTimelineQuery(string Waybill) : IRequest<PublicTrackingTimelineDto?>;

public class TrackingHandler(ICargoMintDbContext context) : 
    IRequestHandler<AddTrackingScanCommand, bool>,
    IRequestHandler<GetTrackingHistoryQuery, List<ShipmentTracking>>,
    IRequestHandler<GetPublicTrackingTimelineQuery, PublicTrackingTimelineDto?>
{
    private static readonly string[] MilestoneOrder =
    [
        "Created",
        "Picked Up",
        "In Transit",
        "At Hub",
        "Out for Delivery",
        "Delivered"
    ];

    public async Task<bool> Handle(AddTrackingScanCommand request, CancellationToken cancellationToken)
    {
        var scan = new ShipmentTracking
        {
            Waybill = request.Waybill,
            Location = request.Location,
            StatusDescription = request.Status,
            ScanTime = DateTime.UtcNow
        };

        context.ShipmentTrackings.Add(scan);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<List<ShipmentTracking>> Handle(GetTrackingHistoryQuery request, CancellationToken cancellationToken)
    {
        return await context.ShipmentTrackings
            .Where(t => t.Waybill == request.Waybill)
            .OrderByDescending(t => t.ScanTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<PublicTrackingTimelineDto?> Handle(GetPublicTrackingTimelineQuery request, CancellationToken cancellationToken)
    {
        var shipment = await context.Shipments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);
        if (shipment == null)
        {
            return null;
        }

        var scans = await context.ShipmentTrackings
            .AsNoTracking()
            .Where(t => t.Waybill == request.Waybill)
            .OrderBy(t => t.ScanTime)
            .ToListAsync(cancellationToken);

        var timeline = BuildTimeline(shipment, scans);
        var currentStatus = ResolveCurrentStatus(shipment.Status, scans);

        return new PublicTrackingTimelineDto(shipment.Waybill, currentStatus, timeline);
    }

    private static IReadOnlyList<PublicTrackingMilestoneDto> BuildTimeline(Shipment shipment, IReadOnlyList<ShipmentTracking> scans)
    {
        var milestones = new List<PublicTrackingMilestoneDto>
        {
            new("Created", true, shipment.CreatedAt, null)
        };

        milestones.AddRange(MilestoneOrder
            .Where(x => x != "Created")
            .Select(milestone => BuildMilestone(milestone, scans)));

        return milestones;
    }

    private static PublicTrackingMilestoneDto BuildMilestone(string milestone, IEnumerable<ShipmentTracking> scans)
    {
        var match = scans.FirstOrDefault(x => MapScanStatus(x.StatusDescription) == milestone);
        return match == null
            ? new PublicTrackingMilestoneDto(milestone, false, null, null)
            : new PublicTrackingMilestoneDto(milestone, true, match.ScanTime, match.Location);
    }

    private static string ResolveCurrentStatus(ShipmentScanStatus shipmentStatus, IEnumerable<ShipmentTracking> scans)
    {
        var lastScan = scans.OrderByDescending(x => x.ScanTime).FirstOrDefault();
        return lastScan != null
            ? MapScanStatus(lastScan.StatusDescription)
            : MapShipmentStatus(shipmentStatus);
    }

    private static string MapShipmentStatus(ShipmentScanStatus status) => status switch
    {
        ShipmentScanStatus.Delivered => "Delivered",
        ShipmentScanStatus.OutForDelivery => "Out for Delivery",
        ShipmentScanStatus.Manifested => "In Transit",
        ShipmentScanStatus.Processing => "Picked Up",
        ShipmentScanStatus.ReceivedAtBranch => "At Hub",
        _ => "Created"
    };

    private static string MapScanStatus(string status)
    {
        var normalized = status.Trim().ToLowerInvariant();
        return normalized switch
        {
            "picked up" or "pickup" => "Picked Up",
            "in transit" => "In Transit",
            "arrived at hub" or "at hub" or "received at branch" => "At Hub",
            "out for delivery" => "Out for Delivery",
            "delivered" => "Delivered",
            _ => "In Transit"
        };
    }
}
