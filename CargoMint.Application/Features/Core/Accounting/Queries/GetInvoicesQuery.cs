using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Accounting.Queries;

public record InvoiceDto(
    string InvoiceNumber,
    string Client,
    string Period,
    string Shipments,
    string Amount,
    string Due,
    string Status
);

public record GetInvoicesQuery : IRequest<List<InvoiceDto>>;

public class GetInvoicesHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetInvoicesQuery, List<InvoiceDto>>
{
    public async Task<List<InvoiceDto>> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId ?? 0;
        var serviceCentreId = tenantProvider.GetServiceCentreId();

        var query = context.Invoices.Where(i => i.TenantId == tenantId);

        if (serviceCentreId.HasValue)
        {
            query = query.Where(i => i.ServiceCentreId == serviceCentreId.Value);
        }

        var results = await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(20)
            .Select(i => new InvoiceDto(
                i.InvoiceNumber,
                "Retail Customer", // Default for now, should link to Customer if exists
                i.CreatedAt.ToString("MMM dd"),
                "1",
                $"₦{i.Amount:N0}",
                i.CreatedAt.AddDays(7).ToString("MMM dd"),
                i.PaymentStatus.ToString()
            ))
            .ToListAsync(cancellationToken);

        return results;
    }
}
