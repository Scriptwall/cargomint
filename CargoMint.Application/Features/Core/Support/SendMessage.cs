using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Support;

public record SendMessageCommand(
    int TicketId,
    string Body,
    bool IsInternalNote = false) : IRequest<SendMessageResponse>;

public record SendMessageResponse(int MessageId, DateTime CreatedAt);

public class SendMessageHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<SendMessageCommand, SendMessageResponse>
{
    public async Task<SendMessageResponse> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;

        if (!tenantId.HasValue || string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("User must be authenticated.");

        var isSuperAdmin = tenantProvider.HasAnyRole(["SuperAdmin", "Admin"]);

        var ticket = await context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null || (!isSuperAdmin && ticket.TenantId != tenantId.Value))
            throw new KeyNotFoundException("Ticket not found or access denied.");

        if (ticket.Status == TicketStatus.Closed)
            throw new InvalidOperationException("Cannot send messages to a closed ticket.");

        var senderRole = DetermineSenderRole(tenantProvider);
        var userNameClaim = tenantProvider.GetUserName();

        if (request.IsInternalNote && senderRole == TicketCreatorRole.Customer)
            throw new InvalidOperationException("Customers cannot add internal notes.");

        var message = new TicketMessage
        {
            SupportTicketId = request.TicketId,
            SenderUserId = userId,
            SenderUserName = userNameClaim,
            SenderRole = senderRole,
            Body = request.Body.Trim(),
            IsInternalNote = request.IsInternalNote,
            IsRead = false
        };

        context.TicketMessages.Add(message);

        ticket.LastMessagePreview = request.Body.Length > 200 ? request.Body[..200] : request.Body;
        ticket.LastActivityAtUtc = DateTime.UtcNow;

        if (ticket.Status == TicketStatus.Resolved)
        {
            ticket.Status = TicketStatus.InProgress;
        }

        await context.SaveChangesAsync(cancellationToken);

        return new SendMessageResponse(message.Id, message.CreatedAt);
    }

    private static TicketCreatorRole DetermineSenderRole(ITenantProvider provider)
    {
        if (provider.HasAnyRole(["SuperAdmin", "Admin"])) return TicketCreatorRole.PlatformAdmin;
        if (provider.HasAnyRole(["TenantAdmin"])) return TicketCreatorRole.TenantAdmin;
        if (provider.HasAnyRole(["Customer"])) return TicketCreatorRole.Customer;
        return TicketCreatorRole.OperationsStaff;
    }
}
