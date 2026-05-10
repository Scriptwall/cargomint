using CargoMint.Application.Common;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Customers;

// 1. Create Company
public record CreateCompanyCommand(
    string Name, 
    string Email, 
    string PhoneNumber, 
    CompanyType Type = CompanyType.Corporate,
    string? Address = null) : IRequest<int>;

public class CreateCompanyHandler(ICargoMintDbContext context) : IRequestHandler<CreateCompanyCommand, int>
{
    public async Task<int> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        var code = $"CMP-{request.Name[..Math.Min(request.Name.Length, 4)].ToUpper()}-{Guid.NewGuid().ToString()[..4]}";
        
        var company = new Company
        {
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            CompanyType = request.Type,
            Address = request.Address,
            CustomerCode = code
        };

        context.Companies.Add(company);
        await context.SaveChangesAsync(cancellationToken);
        return company.Id;
    }
}

// 2. Get Companies (Paged)
public record GetCompaniesQuery(int PageNumber = 1, int PageSize = 10) : IRequest<PagedResult<CompanyResponse>>;

public record CompanyResponse(int Id, string Name, string Email, string PhoneNumber, string CustomerCode, CompanyType Type);

public class GetCompaniesHandler(ICargoMintDbContext context) : IRequestHandler<GetCompaniesQuery, PagedResult<CompanyResponse>>
{
    public async Task<PagedResult<CompanyResponse>> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Companies.AsNoTracking().OrderBy(c => c.Name);
        var total = await query.CountAsync(cancellationToken);
        
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CompanyResponse(c.Id, c.Name, c.Email, c.PhoneNumber, c.CustomerCode, c.CompanyType))
            .ToListAsync(cancellationToken);

        return new PagedResult<CompanyResponse>(items, total, request.PageNumber, request.PageSize);
    }
}
