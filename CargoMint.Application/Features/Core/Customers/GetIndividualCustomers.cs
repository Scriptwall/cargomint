using CargoMint.Application.Common;
using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers;

public record GetIndividualCustomersQuery(int PageNumber = 1, int PageSize = 10) : IRequest<PagedResult<CustomerResponse>>;

public record CustomerResponse(
    int Id, 
    string FirstName, 
    string LastName, 
    string Email, 
    string PhoneNumber, 
    string CustomerCode, 
    bool IsActive);

public class GetIndividualCustomersHandler(
    ICargoMintDbContext context) : IRequestHandler<GetIndividualCustomersQuery, PagedResult<CustomerResponse>>
{
    public async Task<PagedResult<CustomerResponse>> Handle(GetIndividualCustomersQuery request, CancellationToken cancellationToken)
    {
        var query = context.IndividualCustomers.AsNoTracking().OrderBy(c => c.LastName);

        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CustomerResponse(
                c.Id,
                c.FirstName,
                c.LastName,
                c.Email,
                c.PhoneNumber,
                c.CustomerCode,
                c.IsActive))
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerResponse>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
