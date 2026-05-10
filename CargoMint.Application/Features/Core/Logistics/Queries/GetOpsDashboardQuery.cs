using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics.Queries;

public record OpsDashboardResponse(
    int TodayShipments,
    int InTransitCount,
    decimal TodayRevenue,
    decimal PendingCod,
    int SlaAtRiskCount,
    int DelayedCount,
    List<RecentShipmentDto> RecentShipments,
    PipelineStats Pipeline,
    List<OverdueManifestDto> OverdueManifests,
    List<EligibleVehicleDto> EligibleVehicles,
    List<EligibleCaptainDto> EligibleCaptains
);

public record EligibleVehicleDto(int Id, string RegistrationNumber, string Type, string Capacity);
public record EligibleCaptainDto(int Id, string Name);

public record RecentShipmentDto(string Waybill, string SenderRecipient, string Route, string Status, string Amount, string BadgeClass);
public record PipelineStats(int Processing, int Manifested, int InTransit, int OutForDelivery, int DeliveredToday);
public record OverdueManifestDto(string ManifestCode, DateTime DispatchedAt, int HoursElapsed);

public record GetOpsDashboardQuery : IRequest<OpsDashboardResponse>;

public class GetOpsDashboardHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetOpsDashboardQuery, OpsDashboardResponse>
{
    public async Task<OpsDashboardResponse> Handle(GetOpsDashboardQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        
        var serviceCentreId = tenantProvider.GetServiceCentreId();

        var shipmentsQuery = context.Shipments.AsQueryable();
        if (serviceCentreId.HasValue)
        {
            shipmentsQuery = shipmentsQuery.Where(s => 
                s.DepartureServiceCentreId == serviceCentreId.Value || 
                s.DestinationServiceCentreId == serviceCentreId.Value);
        }

        var todayShipmentsCount = await shipmentsQuery
            .CountAsync(s => s.CreatedAt >= today, cancellationToken);

        var inTransitCount = await shipmentsQuery
            .CountAsync(s => s.Status == ShipmentScanStatus.Manifested, cancellationToken);

        var todayRevenue = await shipmentsQuery
            .Where(s => s.CreatedAt >= today)
            .SumAsync(s => s.GrandTotal, cancellationToken);

        var pendingCod = await shipmentsQuery
            .Where(s => s.IsCashOnDelivery && s.PaymentStatus == PaymentStatus.Pending)
            .SumAsync(s => s.CashOnDeliveryAmount ?? 0, cancellationToken);

        var recentShipments = await shipmentsQuery
            .Include(s => s.DepartureStation)
            .Include(s => s.DestinationStation)
            .OrderByDescending(s => s.CreatedAt)
            .Take(5)
            .Select(s => new RecentShipmentDto(
                s.Waybill,
                $"{s.ReceiverName}",
                $"{(s.DepartureStation != null ? s.DepartureStation.Name : "UNK")} → {(s.DestinationStation != null ? s.DestinationStation.Name : "UNK")}",
                s.Status.ToString(),
                $"₦{s.GrandTotal:N0}",
                GetBadgeClass(s.Status)
            ))
            .ToListAsync(cancellationToken);

        var pipeline = new PipelineStats(
            await shipmentsQuery.CountAsync(s => s.Status == ShipmentScanStatus.ReceivedAtBranch || s.Status == ShipmentScanStatus.Processing, cancellationToken),
            await shipmentsQuery.CountAsync(s => s.Status == ShipmentScanStatus.ReadyForManifest, cancellationToken),
            await shipmentsQuery.CountAsync(s => s.Status == ShipmentScanStatus.Manifested, cancellationToken),
            await shipmentsQuery.CountAsync(s => s.Status == ShipmentScanStatus.OutForDelivery, cancellationToken),
            await shipmentsQuery.CountAsync(s => s.Status == ShipmentScanStatus.Delivered && s.CreatedAt >= today, cancellationToken)
        );

        var slaAtRiskCount = await shipmentsQuery
            .CountAsync(s => !s.IsDelayed &&
                             s.EstimatedDeliveryTime.HasValue &&
                             s.EstimatedDeliveryTime.Value <= DateTime.UtcNow.AddHours(4) &&
                             s.Status != ShipmentScanStatus.Delivered, cancellationToken);

        var delayedCount = await shipmentsQuery
            .CountAsync(s => s.IsDelayed && s.Status != ShipmentScanStatus.Delivered, cancellationToken);

        var overdueThreshold = DateTime.UtcNow.AddHours(-48);
        
        var manifestsQuery = context.Manifests.AsQueryable();
        if (serviceCentreId.HasValue)
        {
            manifestsQuery = manifestsQuery.Where(m => 
                m.DepartureServiceCentreId == serviceCentreId.Value || 
                m.DestinationServiceCentreId == serviceCentreId.Value);
        }

        var overdueManifests = await manifestsQuery
            .Where(m => m.IsDispatched && !m.IsReceived && m.DateTime <= overdueThreshold)
            .Select(m => new OverdueManifestDto(
                m.ManifestCode,
                m.DateTime,
                (int)(DateTime.UtcNow - m.DateTime).TotalHours))
            .OrderByDescending(m => m.HoursElapsed)
            .Take(10)
            .ToListAsync(cancellationToken);

        var eligibleVehicles = await context.Fleets
            .Where(f => f.TenantId == (tenantProvider.TenantId ?? 0) && f.IsActive)
            .Select(f => new EligibleVehicleDto(f.Id, f.RegistrationNumber, f.FleetType.ToString(), $"{f.Capacity}kg"))
            .ToListAsync(cancellationToken);

        var eligibleCaptains = await context.Captains
            .Include(c => c.User)
            .Where(c => c.TenantId == (tenantProvider.TenantId ?? 0) && c.IsAvailable && !c.IsComplianceLocked)
            .Select(c => new EligibleCaptainDto(c.Id, (c.User != null ? (c.User.FirstName + " " + c.User.LastName) : "Unknown Captain")))
            .ToListAsync(cancellationToken);

        return new OpsDashboardResponse(
            todayShipmentsCount,
            inTransitCount,
            todayRevenue,
            pendingCod,
            slaAtRiskCount,
            delayedCount,
            recentShipments,
            pipeline,
            overdueManifests,
            eligibleVehicles,
            eligibleCaptains
        );
    }

    private static string GetBadgeClass(ShipmentScanStatus status) => status switch
    {
        ShipmentScanStatus.Delivered => "badge-green",
        ShipmentScanStatus.Manifested => "badge-blue",
        ShipmentScanStatus.Cancelled => "badge-red",
        _ => "badge-amber"
    };
}
