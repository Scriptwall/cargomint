using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers.Queries;

public record MerchantDashboardResponse(
    int TotalShipments,
    int SuccessfulDeliveries,
    decimal TotalSpend,
    decimal WalletBalance,
    List<MerchantShipmentDto> RecentShipments
);

public record MerchantShipmentDto(
    string Waybill,
    string Receiver,
    string Destination,
    string Status,
    string Date,
    string Amount,
    string? Driver
);

public record GetMerchantDashboardQuery(string Email) : IRequest<MerchantDashboardResponse>;

public class GetMerchantDashboardHandler(ICargoMintDbContext context) : IRequestHandler<GetMerchantDashboardQuery, MerchantDashboardResponse>
{
    public async Task<MerchantDashboardResponse> Handle(GetMerchantDashboardQuery request, CancellationToken cancellationToken)
    {
        // Find customer code by email
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

        if (customerCode == null)
        {
            return new MerchantDashboardResponse(0, 0, 0, 0, new List<MerchantShipmentDto>());
        }

        var shipments = await context.Shipments
            .Where(s => s.CustomerCode == customerCode)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        var totalShipments = shipments.Count;
        var successfulDeliveries = shipments.Count(s => s.Status == CargoMint.Domain.Enums.ShipmentScanStatus.Delivered);
        var totalSpend = shipments.Sum(s => s.GrandTotal);
        
        var wallet = await context.Wallets
            .Where(w => w.CustomerCode == customerCode)
            .Select(w => w.Balance)
            .FirstOrDefaultAsync(cancellationToken);

        var recentShipments = shipments.Take(5).Select(s => new MerchantShipmentDto(
            s.Waybill,
            s.ReceiverName,
            s.ReceiverAddress ?? "N/A",
            s.Status.ToString().ToLower(),
            s.CreatedAt.ToString("MMM dd, yyyy"),
            $"₦{s.GrandTotal:N0}",
            null // Driver info needs more joins
        )).ToList();

        return new MerchantDashboardResponse(
            totalShipments,
            successfulDeliveries,
            totalSpend,
            wallet,
            recentShipments
        );
    }
}
