using CargoMint.Application.Interfaces;
using CargoMint.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Common.Behaviors;

public class SubscriptionBehavior<TRequest, TResponse>(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        // Subscription enforcement is handled by the Enterprise layer.
        // Core open-source community edition does not enforce SaaS billing restrictions.
        return await next();
    }
}
