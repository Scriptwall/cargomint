using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics.Queries;

public record SortPoolItemDto(
    string Id, // Waybill
    string Type, // standard/express
    string Wt, // weight
    string Name, // route e.g. Lagos → Abuja
    string Route, // short route e.g. LOS→ABJ
    string Amt // amount
);

public record GetSortPoolQuery : IRequest<List<SortPoolItemDto>>;

public class GetSortPoolHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetSortPoolQuery, List<SortPoolItemDto>>
{
    private static readonly string[] TenantWideRoles = ["TenantAdmin", "HubManager", "Admin", "SuperAdmin", "DeskOperator", "Operator", "ServiceCentreAdmin"];

    public async Task<List<SortPoolItemDto>> Handle(GetSortPoolQuery request, CancellationToken cancellationToken)
    {
        var serviceCentreId = tenantProvider.GetServiceCentreId();
        var hasTenantWideAccess = tenantProvider.HasAnyRole(TenantWideRoles);

        var query = context.Shipments
            .Include(s => s.Items)
            .Include(s => s.DepartureServiceCentre)
            .Include(s => s.DestinationServiceCentre)
            .AsQueryable();

        // Scope to service centre only if assigned AND not a tenant-wide role
        if (serviceCentreId.HasValue && !hasTenantWideAccess)
        {
            query = query.Where(s => s.DepartureServiceCentreId == serviceCentreId.Value);
        }

        // Both statuses indicate shipment is physically present and ready to sort:
        // - Processing: pickup-collected shipments
        // - ReceivedAtBranch: desk drop-offs (most common desk creation mode)
        var pool = await query
            .Where(s => s.Status == ShipmentScanStatus.Processing ||
                        s.Status == ShipmentScanStatus.ReceivedAtBranch)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return pool.Select(s => new SortPoolItemDto(
            s.Waybill,
            "Standard",
            $"{s.Items.Sum(i => i.Weight)}kg",
            $"{s.DepartureServiceCentre?.Name ?? "Unknown"} → {s.DestinationServiceCentre?.Name ?? "Unknown"}",
            $"{s.DepartureServiceCentre?.Name?.Substring(0, Math.Min(3, s.DepartureServiceCentre.Name.Length)).ToUpper() ?? "UNK"}→{s.DestinationServiceCentre?.Name?.Substring(0, Math.Min(3, s.DestinationServiceCentre.Name.Length)).ToUpper() ?? "UNK"}",
            $"₦{s.GrandTotal}"
        )).ToList();
    }
}
