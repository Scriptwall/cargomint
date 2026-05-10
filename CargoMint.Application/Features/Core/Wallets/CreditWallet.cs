using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Wallets;

public record CreditWalletCommand(
    string CustomerCode, 
    decimal Amount, 
    string Description, 
    PaymentType PaymentType,
    string? Reference = null) : IRequest<bool>;

public class CreditWalletHandler(
    ICargoMintDbContext context) : IRequestHandler<CreditWalletCommand, bool>
{
    public async Task<bool> Handle(CreditWalletCommand request, CancellationToken cancellationToken)
    {
        var wallet = await context.Wallets
            .FirstOrDefaultAsync(w => w.CustomerCode == request.CustomerCode, cancellationToken);

        if (wallet == null) return false;

        // 1. Update Balance
        wallet.Balance += request.Amount;

        // 2. Record Transaction
        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = request.Amount,
            CreditDebitType = CreditDebitType.Credit,
            Description = request.Description,
            PaymentType = request.PaymentType,
            PaymentReference = request.Reference,
            BalanceAfterTransaction = wallet.Balance,
            ServiceCentreId = 1 // Simplified: Should be injected or determined by current station
        };

        context.WalletTransactions.Add(transaction);

        // 3. Persist (EF Core wraps this in a single transaction automatically)
        await context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
