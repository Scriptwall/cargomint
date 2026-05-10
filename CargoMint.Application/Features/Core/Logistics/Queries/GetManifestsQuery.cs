using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics.Queries;

public record ManifestSummaryDto(
    string ManifestCode,
    string Route,
    string Meta,
    string Note,
    string Status
);

public record ManifestsBoardResponse(
    List<ManifestSummaryDto> Pending,
    List<ManifestSummaryDto> InTransit,
    List<ManifestSummaryDto> Delivered
);

public record GetManifestsQuery : IRequest<ManifestsBoardResponse>;

public class GetManifestsHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetManifestsQuery, ManifestsBoardResponse>
{
    public async Task<ManifestsBoardResponse> Handle(GetManifestsQuery request, CancellationToken cancellationToken)
    {
        var serviceCentreId = tenantProvider.GetServiceCentreId();

        var query = context.Manifests
            .Include(m => m.Items)
            .Include(m => m.Captain).ThenInclude(c => c.User)
            .AsQueryable();

        if (serviceCentreId.HasValue)
        {
            query = query.Where(m => 
                m.DepartureServiceCentreId == serviceCentreId.Value || 
                m.DestinationServiceCentreId == serviceCentreId.Value);
        }

        var manifests = await query
            .Include(m => m.DepartureServiceCentre)
            .Include(m => m.DestinationServiceCentre)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var pending = manifests.Where(m => m.Status == CargoMint.Domain.Entities.Core.ManifestStatus.Pending)
            .Select(m => new ManifestSummaryDto(
                m.ManifestCode,
                $"{(m.DepartureServiceCentre?.Name ?? "UNK")} → {(m.DestinationServiceCentre?.Name ?? "UNK")}",
                $"{m.Items.Count} shipments",
                "Awaiting dispatch",
                "Pending"
            )).ToList();

        var inTransit = manifests.Where(m => m.Status == CargoMint.Domain.Entities.Core.ManifestStatus.Dispatched)
            .Select(m => new ManifestSummaryDto(
                m.ManifestCode,
                $"{(m.DepartureServiceCentre?.Name ?? "UNK")} → {(m.DestinationServiceCentre?.Name ?? "UNK")}",
                $"{m.Items.Count} shipments",
                m.Captain?.User?.FirstName ?? "Unknown",
                "In Transit"
            )).ToList();

        var delivered = manifests.Where(m => m.Status == CargoMint.Domain.Entities.Core.ManifestStatus.Received)
            .Select(m => new ManifestSummaryDto(
                m.ManifestCode,
                $"{(m.DepartureServiceCentre?.Name ?? "UNK")} → {(m.DestinationServiceCentre?.Name ?? "UNK")}",
                $"{m.Items.Count} shipments",
                "Completed",
                "Delivered"
            )).ToList();

        return new ManifestsBoardResponse(pending, inTransit, delivered);
    }
}
