using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers.Queries;

public record MerchantCustomerDto(
    string Name,
    string Phone,
    string Address,
    int TotalOrders
);

public record GetMerchantCustomersQuery(string Email) : IRequest<List<MerchantCustomerDto>>;

public class GetMerchantCustomersHandler(ICargoMintDbContext context) : IRequestHandler<GetMerchantCustomersQuery, List<MerchantCustomerDto>>
{
    public async Task<List<MerchantCustomerDto>> Handle(GetMerchantCustomersQuery request, CancellationToken cancellationToken)
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

        if (customerCode == null) return new List<MerchantCustomerDto>();

        // Pull unique receivers from shipment history as "Saved Customers"
        var customers = await context.Shipments
            .Where(s => s.CustomerCode == customerCode)
            .GroupBy(s => new { s.ReceiverName, s.ReceiverPhoneNumber, s.ReceiverAddress })
            .Select(g => new MerchantCustomerDto(
                g.Key.ReceiverName,
                g.Key.ReceiverPhoneNumber ?? "N/A",
                g.Key.ReceiverAddress ?? "N/A",
                g.Count()
            ))
            .OrderByDescending(c => c.TotalOrders)
            .Take(50)
            .ToListAsync(cancellationToken);

        return customers;
    }
}
