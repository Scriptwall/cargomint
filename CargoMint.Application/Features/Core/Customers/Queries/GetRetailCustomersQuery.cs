using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers.Queries;

public record RetailCustomerDto(
    string Name,
    string EmailPhone,
    int TotalShipments,
    string WalletBalance,
    string Status
);

public record GetRetailCustomersQuery : IRequest<List<RetailCustomerDto>>;

public class GetRetailCustomersHandler(ICargoMintDbContext context) : IRequestHandler<GetRetailCustomersQuery, List<RetailCustomerDto>>
{
    public async Task<List<RetailCustomerDto>> Handle(GetRetailCustomersQuery request, CancellationToken cancellationToken)
    {
        var customers = await context.IndividualCustomers
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new RetailCustomerDto(
                $"{c.FirstName} {c.LastName}",
                c.PhoneNumber,
                0, // Count shipments later
                "₦0", // Wallet balance later
                "Active"
            ))
            .ToListAsync(cancellationToken);

        return customers;
    }
}
