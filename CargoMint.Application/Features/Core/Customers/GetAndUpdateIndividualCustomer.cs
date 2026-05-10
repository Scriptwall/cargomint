using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers;

// 1. Get By ID
public record GetIndividualCustomerByIdQuery(int Id) : IRequest<CustomerResponse?>;

public class GetIndividualCustomerByIdHandler(
    ICargoMintDbContext context) : IRequestHandler<GetIndividualCustomerByIdQuery, CustomerResponse?>
{
    public async Task<CustomerResponse?> Handle(GetIndividualCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        return await context.IndividualCustomers
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CustomerResponse(
                c.Id,
                c.FirstName,
                c.LastName,
                c.Email,
                c.PhoneNumber,
                c.CustomerCode,
                c.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }
}

// 2. Update
public record UpdateIndividualCustomerCommand(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string? Address) : IRequest<bool>;

public class UpdateIndividualCustomerHandler(
    ICargoMintDbContext context) : IRequestHandler<UpdateIndividualCustomerCommand, bool>
{
    public async Task<bool> Handle(UpdateIndividualCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await context.IndividualCustomers
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
            
        if (customer == null) return false;

        customer.FirstName = request.FirstName;
        customer.LastName = request.LastName;
        customer.Email = request.Email;
        customer.Address = request.Address;

        // LastModifiedAt is handled automatically by DbContext
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
