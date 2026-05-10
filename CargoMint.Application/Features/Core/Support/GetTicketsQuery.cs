using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Support;

public record SupportTicketDto(
    int Id,
    string TicketNumber,
    string Subject,
    string Description,
    string Category,
    string Priority,
    string Status,
    string EscalationLevel,
    string CreatorRole,
    string CreatedByUserId,
    string? CreatedByUserName,
    string? CreatedByUserEmail,
    string? AssignedToUserId,
    string? AssignedToUserName,
    int? RelatedShipmentId,
    string? RelatedWaybill,
    int? RelatedServiceCentreId,
    string? LastMessagePreview,
    int UnreadCount,
    DateTime LastActivityAtUtc,
    DateTime CreatedAt
);

public record SupportTicketDetailDto(
    int Id,
    string TicketNumber,
    string Subject,
    string Description,
    string Category,
    string Priority,
    string Status,
    string EscalationLevel,
    string CreatorRole,
    string CreatedByUserId,
    string? CreatedByUserName,
    string? CreatedByUserEmail,
    string? AssignedToUserId,
    string? AssignedToUserName,
    int? RelatedShipmentId,
    string? RelatedWaybill,
    int? RelatedServiceCentreId,
    string? LastMessagePreview,
    DateTime LastActivityAtUtc,
    DateTime CreatedAt,
    DateTime? ClosedAtUtc,
    List<TicketMessageDto> Messages
);

public record TicketMessageDto(
    int Id,
    string SenderUserId,
    string? SenderUserName,
    string SenderRole,
    string Body,
    string? AttachmentUrl,
    bool IsInternalNote,
    bool IsRead,
    DateTime CreatedAt
);

public record GetTicketsQuery(
    string? Status = null,
    string? Priority = null,
    string? Category = null,
    string? Search = null) : IRequest<List<SupportTicketDto>>;

public class GetTicketsHandler(ICargoMintDbContext context, ITenantProvider tenantProvider) : IRequestHandler<GetTicketsQuery, List<SupportTicketDto>>
{
    public async Task<List<SupportTicketDto>> Handle(GetTicketsQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;
        var isSuperAdmin = tenantProvider.HasAnyRole(["SuperAdmin", "Admin"]);
        var isTenantAdmin = tenantProvider.HasAnyRole(["TenantAdmin"]);

        if (!tenantId.HasValue && !isSuperAdmin) return [];

        var query = context.SupportTickets.AsQueryable();

        if (!isSuperAdmin)
        {
            query = query.Where(t => t.TenantId == tenantId!.Value);
        }

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<TicketStatus>(request.Status, true, out var status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrEmpty(request.Priority) && Enum.TryParse<TicketPriority>(request.Priority, true, out var priority))
        {
            query = query.Where(t => t.Priority == priority);
        }

        if (!string.IsNullOrEmpty(request.Category) && Enum.TryParse<TicketCategory>(request.Category, true, out var category))
        {
            query = query.Where(t => t.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(t =>
                t.TicketNumber.Contains(search) ||
                t.Subject.Contains(search) ||
                (t.RelatedWaybill != null && t.RelatedWaybill.Contains(search)) ||
                (t.CreatedByUserEmail != null && t.CreatedByUserEmail.Contains(search)));
        }

        if (!isSuperAdmin && !isTenantAdmin)
        {
            var serviceCentreId = tenantProvider.GetServiceCentreId();
            if (serviceCentreId.HasValue)
            {
                query = query.Where(t => t.RelatedServiceCentreId == serviceCentreId.Value || t.CreatedByUserId == userId);
            }
            else if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(t => t.CreatedByUserId == userId);
            }
        }

        var tickets = await query
            .OrderByDescending(t => t.LastActivityAtUtc)
            .ThenByDescending(t => t.CreatedAt)
            .Take(100)
            .Select(t => new SupportTicketDto(
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
                t.Messages.Count(m => !m.IsRead && m.SenderUserId != userId),
                t.LastActivityAtUtc ?? t.CreatedAt,
                t.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return tickets;
    }
}
