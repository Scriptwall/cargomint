using CargoMint.Application.Interfaces;
using CargoMint.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers;

public record DeactivateIndividualCustomerCommand(int Id) : IRequest<bool>;

public class DeactivateIndividualCustomerHandler(
    ICargoMintDbContext context) : IRequestHandler<DeactivateIndividualCustomerCommand, bool>
{
    public async Task<bool> Handle(DeactivateIndividualCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await context.IndividualCustomers
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
            
        if (customer == null) return false;

        customer.IsActive = false;
        
        // If we want actual soft-delete:
        // customer.IsDeleted = true;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
