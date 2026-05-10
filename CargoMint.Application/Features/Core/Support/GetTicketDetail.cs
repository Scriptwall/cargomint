using CargoMint.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Support;

public record GetTicketDetailQuery(int TicketId) : IRequest<SupportTicketDetailDto?>;

public class GetTicketDetailHandler(ICargoMintDbContext context, ITenantProvider tenantProvider)
    : IRequestHandler<GetTicketDetailQuery, SupportTicketDetailDto?>
{
    public async Task<SupportTicketDetailDto?> Handle(GetTicketDetailQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;
        var isSuperAdmin = tenantProvider.HasAnyRole(["SuperAdmin", "Admin"]);

        var ticket = await context.SupportTickets
            .Where(t => t.Id == request.TicketId)
            .Select(t => new SupportTicketDetailDto(
                t.Id,
                t.TicketNumber,
                t.Subject,
                t.Description,
                t.Category.ToString(),
                t.Priority.ToString(),
                t.Status.ToString(),
                t.EscalationLevel.ToString(),
                t.CreatorRole.ToString(),
                t.CreatedByUserId,
                t.CreatedByUserName,
                t.CreatedByUserEmail,
                t.AssignedToUserId,
                t.AssignedToUserName,
                t.RelatedShipmentId,
                t.RelatedWaybill,
                t.RelatedServiceCentreId,
                t.LastMessagePreview,
                t.LastActivityAtUtc ?? t.CreatedAt,
                t.CreatedAt,
                t.ClosedAtUtc,
                t.Messages
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new TicketMessageDto(
                        m.Id,
                        m.SenderUserId,
                        m.SenderUserName,
                        m.SenderRole.ToString(),
                        m.Body,
                        m.AttachmentUrl,
                        m.IsInternalNote,
                        m.IsRead,
                        m.CreatedAt
                    ))
                    .ToList()
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (ticket == null || (!isSuperAdmin && ticket.CreatorRole != "PlatformAdmin" && ticket.CreatedByUserId != userId && ticket.AssignedToUserId != userId))
        {
            var tenantCheck = await context.SupportTickets
                .AnyAsync(t => t.Id == request.TicketId && t.TenantId == tenantId!.Value, cancellationToken);

            if (!tenantCheck && !isSuperAdmin) return null;
        }

        return ticket;
    }
}
