using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Support;

public record CreateTicketCommand(
    string Subject,
    string Description,
    string Category,
    string Priority = "Medium",
    int? RelatedShipmentId = null,
    string? RelatedWaybill = null,
    int? RelatedServiceCentreId = null,
    string? RelatedCustomerId = null) : IRequest<CreateTicketResponse>;

public record CreateTicketResponse(int TicketId, string TicketNumber);

public class CreateTicketHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<CreateTicketCommand, CreateTicketResponse>
{
    public async Task<CreateTicketResponse> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;

        if (!tenantId.HasValue || string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("User must be authenticated and belong to a tenant.");

        if (!Enum.TryParse<TicketCategory>(request.Category, true, out var category))
            throw new ArgumentException($"Invalid ticket category: {request.Category}");

        if (!Enum.TryParse<TicketPriority>(request.Priority, true, out var priority))
            throw new ArgumentException($"Invalid ticket priority: {request.Priority}");

        var creatorRole = DetermineCreatorRole(tenantProvider);
        var escalationLevel = DetermineEscalationLevel(creatorRole);
        var status = DetermineInitialStatus(creatorRole);

        var ticketNumber = await GenerateTicketNumberAsync(tenantId.Value, cancellationToken);

        var userEmailClaim = tenantProvider.GetUserEmail();
        var userNameClaim = tenantProvider.GetUserName();

        var ticket = new SupportTicket
        {
            TenantId = tenantId.Value,
            TicketNumber = ticketNumber,
            Subject = request.Subject.Trim(),
            Description = request.Description.Trim(),
            Category = category,
            Priority = priority,
            Status = status,
            EscalationLevel = escalationLevel,
            CreatorRole = creatorRole,
            CreatedByUserId = userId,
            CreatedByUserName = userNameClaim,
            CreatedByUserEmail = userEmailClaim,
            RelatedShipmentId = request.RelatedShipmentId,
            RelatedWaybill = request.RelatedWaybill?.Trim(),
            RelatedServiceCentreId = request.RelatedServiceCentreId,
            RelatedCustomerId = request.RelatedCustomerId?.Trim(),
            LastActivityAtUtc = DateTime.UtcNow,
            LastMessagePreview = request.Description.Length > 200
                ? request.Description[..200]
                : request.Description
        };

        context.SupportTickets.Add(ticket);
        await context.SaveChangesAsync(cancellationToken);

        return new CreateTicketResponse(ticket.Id, ticketNumber);
    }

    private static TicketCreatorRole DetermineCreatorRole(ITenantProvider provider)
    {
        if (provider.HasAnyRole(["SuperAdmin", "Admin"])) return TicketCreatorRole.PlatformAdmin;
        if (provider.HasAnyRole(["TenantAdmin"])) return TicketCreatorRole.TenantAdmin;
        if (provider.HasAnyRole(["Customer"])) return TicketCreatorRole.Customer;
        return TicketCreatorRole.OperationsStaff;
    }

    private static EscalationLevel DetermineEscalationLevel(TicketCreatorRole role) => role switch
    {
        TicketCreatorRole.Customer => EscalationLevel.TenantInternal,
        TicketCreatorRole.OperationsStaff => EscalationLevel.TenantInternal,
        TicketCreatorRole.TenantAdmin => EscalationLevel.TenantAdminReview,
        TicketCreatorRole.PlatformAdmin => EscalationLevel.PlatformSupport,
        _ => EscalationLevel.TenantInternal
    };

    private static TicketStatus DetermineInitialStatus(TicketCreatorRole role) => role switch
    {
        TicketCreatorRole.Customer => TicketStatus.WaitingForTenantAdmin,
        TicketCreatorRole.OperationsStaff => TicketStatus.Open,
        TicketCreatorRole.TenantAdmin => TicketStatus.Open,
        TicketCreatorRole.PlatformAdmin => TicketStatus.Open,
        _ => TicketStatus.Open
    };

    private async Task<string> GenerateTicketNumberAsync(int tenantId, CancellationToken ct)
    {
        var today = DateTime.UtcNow;
        var prefix = $"TK-{today:yyyyMMdd}";

        var lastTicket = await context.SupportTickets
            .Where(t => t.TenantId == tenantId && t.TicketNumber.StartsWith(prefix))
            .OrderByDescending(t => t.TicketNumber)
            .Select(t => t.TicketNumber)
            .FirstOrDefaultAsync(ct);

        var sequence = 1;
        if (!string.IsNullOrEmpty(lastTicket))
        {
            var parts = lastTicket.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}-{sequence:D4}";
    }
}
