using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics.Queries;

public record LogisticsStationResponse(int Id, string Name, string Code, string StateName);

public record GetLogisticsStationsQuery : IRequest<List<LogisticsStationResponse>>;

public class GetLogisticsStationsHandler(ICargoMintDbContext context) : IRequestHandler<GetLogisticsStationsQuery, List<LogisticsStationResponse>>
{
    public async Task<List<LogisticsStationResponse>> Handle(GetLogisticsStationsQuery request, CancellationToken cancellationToken)
    {
        // Only return stations where this tenant has an active service centre
        return await context.ServiceCentres
            .Where(sc => sc.IsActive && !sc.IsDeleted)
            .Include(sc => sc.Station)
            .ThenInclude(s => s!.State)
            .Select(sc => sc.Station!)
            .Where(s => s != null)
            .Distinct()
            .OrderBy(s => s.Name)
            .Select(s => new LogisticsStationResponse(
                s.Id,
                s.Name,
                s.Code ?? string.Empty,
                s.State != null ? s.State.Name : string.Empty
            ))
            .ToListAsync(cancellationToken);
    }
}
