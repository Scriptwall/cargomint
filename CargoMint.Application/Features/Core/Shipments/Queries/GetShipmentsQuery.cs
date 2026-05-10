using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments.Queries;

public record ShipmentListItemDto(
    string Waybill,
    string Sender,
    string Recipient,
    string Route,
    string Type,
    string Weight,
    string Amount,
    string Payment,
    string Status,
    string BadgeClass
);

public record GetShipmentsQuery : IRequest<List<ShipmentListItemDto>>;

public class GetShipmentsHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetShipmentsQuery, List<ShipmentListItemDto>>
{
    // Roles that can see all shipments across the tenant (not SC-scoped)
    private static readonly string[] TenantWideRoles = ["TenantAdmin", "HubManager", "Admin", "SuperAdmin", "DeskOperator", "Operator", "ServiceCentreAdmin"];

    public async Task<List<ShipmentListItemDto>> Handle(GetShipmentsQuery request, CancellationToken cancellationToken)
    {
        var serviceCentreId = tenantProvider.GetServiceCentreId();
        var hasTenantWideAccess = tenantProvider.HasAnyRole(TenantWideRoles);

        // If no service centre assigned AND no tenant-wide role, deny
        if (!serviceCentreId.HasValue && !hasTenantWideAccess)
        {
            return [];
        }

        var query = context.Shipments
            .Include(s => s.DepartureStation)
            .Include(s => s.DestinationStation)
            .Include(s => s.Items)
            .AsQueryable();

        // Scope to service centre only if assigned AND not a tenant-wide role
        if (serviceCentreId.HasValue && !hasTenantWideAccess)
        {
            query = query.Where(s =>
                s.DepartureServiceCentreId == serviceCentreId.Value ||
                s.DestinationServiceCentreId == serviceCentreId.Value);
        }

        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Take(100)
            .Select(s => new ShipmentListItemDto(
                s.Waybill,
                s.CustomerCode,
                s.ReceiverName,
                $"{s.DepartureStation!.Name ?? "?"} → {s.DestinationStation!.Name ?? "?"}",
                "Standard",
                $"{s.Items.Sum(i => i.Weight * i.Quantity):0.##}kg",
                $"₦{s.GrandTotal:N0}",
                s.IsCashOnDelivery ? "COD" : "Prepaid",
                s.Status.ToString(),
                GetBadgeClass(s.Status)
            ))
            .ToListAsync(cancellationToken);

        return shipments;
    }


    private static string GetBadgeClass(CargoMint.Domain.Enums.ShipmentScanStatus status) => status switch
    {
        CargoMint.Domain.Enums.ShipmentScanStatus.Delivered => "badge-green",
        CargoMint.Domain.Enums.ShipmentScanStatus.Manifested => "badge-blue",
        CargoMint.Domain.Enums.ShipmentScanStatus.Cancelled => "badge-red",
        _ => "badge-amber"
    };
}
