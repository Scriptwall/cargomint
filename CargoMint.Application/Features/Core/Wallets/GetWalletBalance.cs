using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Wallets;

public record GetWalletBalanceQuery(string CustomerCode) : IRequest<WalletBalanceResponse?>;

public record WalletBalanceResponse(string WalletNumber, decimal Balance, string CustomerCode);

public class GetWalletBalanceHandler(
    ICargoMintDbContext context) : IRequestHandler<GetWalletBalanceQuery, WalletBalanceResponse?>
{
    public async Task<WalletBalanceResponse?> Handle(GetWalletBalanceQuery request, CancellationToken cancellationToken)
    {
        return await context.Wallets
            .AsNoTracking()
            .Where(w => w.CustomerCode == request.CustomerCode)
            .Select(w => new WalletBalanceResponse(w.WalletNumber, w.Balance, w.CustomerCode))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
