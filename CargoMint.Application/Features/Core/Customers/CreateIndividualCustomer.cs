using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;

namespace CargoMint.Application.Features.Core.Customers;

public record CreateIndividualCustomerCommand(
    string FirstName, 
    string LastName, 
    string Email, 
    string PhoneNumber, 
    string? Address = null,
    Gender Gender = Gender.Unknown) : IRequest<int>;

public class CreateIndividualCustomerHandler(
    ICargoMintDbContext context) : IRequestHandler<CreateIndividualCustomerCommand, int>
{
    public async Task<int> Handle(CreateIndividualCustomerCommand request, CancellationToken cancellationToken)
    {
        // 1. Generate Customer Code (Simplified for now)
        var customerCode = $"IND-{request.PhoneNumber[..Math.Min(request.PhoneNumber.Length, 8)]}";

        // 2. Map to Entity
        var customer = new IndividualCustomer
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            Gender = request.Gender,
            CustomerCode = customerCode,
            IsActive = true
        };

        // 3. Persist (TenantId and CreatedAt handled by DbContext)
        context.IndividualCustomers.Add(customer);
        await context.SaveChangesAsync(cancellationToken);

        return customer.Id;
    }
}
