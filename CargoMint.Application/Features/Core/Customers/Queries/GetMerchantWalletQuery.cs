using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers.Queries;

public record MerchantWalletResponse(
    decimal Balance,
    List<MerchantTransactionDto> Transactions
);

public record MerchantTransactionDto(
    string Date,
    string Description,
    string Amount,
    bool IsCredit
);

public record GetMerchantWalletQuery(string Email) : IRequest<MerchantWalletResponse>;

public class GetMerchantWalletHandler(ICargoMintDbContext context) : IRequestHandler<GetMerchantWalletQuery, MerchantWalletResponse>
{
    public async Task<MerchantWalletResponse> Handle(GetMerchantWalletQuery request, CancellationToken cancellationToken)
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

        if (customerCode == null) return new MerchantWalletResponse(0, new List<MerchantTransactionDto>());

        var wallet = await context.Wallets
            .Where(w => w.CustomerCode == customerCode)
            .FirstOrDefaultAsync(cancellationToken);

        if (wallet == null) return new MerchantWalletResponse(0, new List<MerchantTransactionDto>());

        var transactions = await context.WalletTransactions
            .Where(t => t.WalletId == wallet.Id)
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new MerchantTransactionDto(
                t.CreatedAt.ToString("MMM dd, yyyy"),
                t.Description ?? "Wallet Transaction",
                $"₦{t.Amount:N0}",
                t.CreditDebitType == CargoMint.Domain.Enums.CreditDebitType.Credit
            ))
            .ToListAsync(cancellationToken);

        return new MerchantWalletResponse(wallet.Balance, transactions);
    }
}
