using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Accounting.Queries;

public record LedgerEntryDto(
    string Date,
    string Shipments,
    string Revenue,
    string CodCollected
);

public record GetLedgerQuery : IRequest<List<LedgerEntryDto>>;

public class GetLedgerHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetLedgerQuery, List<LedgerEntryDto>>
{
    public async Task<List<LedgerEntryDto>> Handle(GetLedgerQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId ?? 0;
        var serviceCentreId = tenantProvider.GetServiceCentreId();

        var query = context.Ledgers.Where(l => l.TenantId == tenantId);

        if (serviceCentreId.HasValue)
        {
            query = query.Where(l => l.ServiceCentreId == serviceCentreId.Value);
        }

        var results = await query
            .OrderByDescending(l => l.CreatedAt)
            .GroupBy(l => l.CreatedAt.Date)
            .Take(10)
            .Select(g => new LedgerEntryDto(
                g.Key.ToString("MMM dd"),
                g.Count(l => l.Waybill != null).ToString(),
                $"₦{g.Where(l => l.CreditDebitType == CreditDebitType.Credit).Sum(l => l.Amount):N0}",
                $"₦{g.Where(l => l.Description != null && l.Description.Contains("COD")).Sum(l => l.Amount):N0}"
            ))
            .ToListAsync(cancellationToken);

        return results;
    }
}
