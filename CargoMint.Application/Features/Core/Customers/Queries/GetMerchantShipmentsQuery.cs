using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers.Queries;

public record GetMerchantShipmentsQuery(string Email) : IRequest<List<MerchantShipmentDto>>;

public class GetMerchantShipmentsHandler(ICargoMintDbContext context) : IRequestHandler<GetMerchantShipmentsQuery, List<MerchantShipmentDto>>
{
    public async Task<List<MerchantShipmentDto>> Handle(GetMerchantShipmentsQuery request, CancellationToken cancellationToken)
    {
        var customerCode = await context.IndividualCustomers
            .Where(c => c.Email == request.Email)
            .Select(c => c.CustomerCode)
            .FirstOrDefaultAsync(cancellationToken);

        if (customerCode == null)
        {
            customerCode = await context.Companies
                .Where(c => c.Email == request.Email)
                .Select(c => c.CustomerCode)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (customerCode == null) return new List<MerchantShipmentDto>();

        var shipments = await context.Shipments
            .Where(s => s.CustomerCode == customerCode)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new MerchantShipmentDto(
                s.Waybill,
                s.ReceiverName,
                s.ReceiverAddress ?? "N/A",
                s.Status.ToString().ToLower(),
                s.CreatedAt.ToString("MMM dd, yyyy"),
                $"₦{s.GrandTotal:N0}",
                null
            ))
            .ToListAsync(cancellationToken);

        return shipments;
    }
}
