using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers.Queries;

public record SearchCustomerResult(
    string Name,
    string Phone,
    string? Email,
    string? Address,
    string CustomerCode,
    CustomerType Type);

public record SearchCustomersQuery(string Query) : IRequest<List<SearchCustomerResult>>;

public class SearchCustomersHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<SearchCustomersQuery, List<SearchCustomerResult>>
{
    public async Task<List<SearchCustomerResult>> Handle(SearchCustomersQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        if (!tenantId.HasValue || tenantId.Value <= 0) return [];

        var query = request.Query.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(query)) return [];

        // 1. Search Individual Customers
        var individuals = await context.IndividualCustomers
            .Where(c => (c.FirstName + " " + c.LastName).ToLower().Contains(query) || c.PhoneNumber.Contains(query))
            .OrderBy(c => c.FirstName)
            .Take(10)
            .Select(c => new SearchCustomerResult(
                $"{c.FirstName} {c.LastName}",
                c.PhoneNumber,
                c.Email,
                c.Address,
                c.CustomerCode,
                CustomerType.Individual))
            .ToListAsync(cancellationToken);

        // 2. Search Companies (Merchants)
        var companies = await context.Companies
            .Where(c => c.Name.ToLower().Contains(query) || c.PhoneNumber.Contains(query))
            .OrderBy(c => c.Name)
            .Take(10)
            .Select(c => new SearchCustomerResult(
                c.Name,
                c.PhoneNumber,
                c.Email,
                c.Address,
                c.CustomerCode,
                CustomerType.Company))
            .ToListAsync(cancellationToken);

        return [.. individuals, .. companies];
    }
}
