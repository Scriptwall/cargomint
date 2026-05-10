using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Support;

public record UpdateTicketStatusCommand(
    int TicketId,
    string Status,
    string? AssignedToUserId = null) : IRequest<bool>;

public class UpdateTicketStatusHandler(ICargoMintDbContext context, ITenantProvider tenantProvider)
    : IRequestHandler<UpdateTicketStatusCommand, bool>
{
    public async Task<bool> Handle(UpdateTicketStatusCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;
        var isSuperAdmin = tenantProvider.HasAnyRole(["SuperAdmin", "Admin"]);

        if (!tenantId.HasValue || string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException();

        var ticket = await context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null || (!isSuperAdmin && ticket.TenantId != tenantId.Value))
            return false;

        if (!Enum.TryParse<TicketStatus>(request.Status, true, out var newStatus))
            throw new ArgumentException($"Invalid status: {request.Status}");

        ticket.Status = newStatus;
        ticket.LastActivityAtUtc = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.AssignedToUserId))
        {
            ticket.AssignedToUserId = request.AssignedToUserId;
        }

        if (newStatus == TicketStatus.Closed || newStatus == TicketStatus.Resolved)
        {
            ticket.ClosedAtUtc = DateTime.UtcNow;
        }
        else if (ticket.ClosedAtUtc.HasValue && newStatus == TicketStatus.InProgress)
        {
            ticket.ClosedAtUtc = null;
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record EscalateTicketCommand(int TicketId) : IRequest<bool>;

public class EscalateTicketHandler(ICargoMintDbContext context, ITenantProvider tenantProvider)
    : IRequestHandler<EscalateTicketCommand, bool>
{
    public async Task<bool> Handle(EscalateTicketCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;
        var isTenantAdmin = tenantProvider.HasAnyRole(["TenantAdmin", "SuperAdmin", "Admin"]);

        if (!tenantId.HasValue || string.IsNullOrEmpty(userId) || !isTenantAdmin)
            throw new UnauthorizedAccessException("Only tenant admins can escalate tickets.");

        var ticket = await context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null || ticket.TenantId != tenantId.Value)
            return false;

        ticket.EscalationLevel = EscalationLevel.PlatformSupport;
        ticket.Status = TicketStatus.EscalatedToPlatformSupport;
        ticket.LastActivityAtUtc = DateTime.UtcNow;
        ticket.LastMessagePreview = "Ticket escalated to platform support.";

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record GetTicketStatsQuery : IRequest<TicketStatsDto>;

public record TicketStatsDto(
    int Total,
    int Open,
    int InProgress,
    int Resolved,
    int Closed,
    int Escalated,
    int Critical,
    int UnreadByMe);

public class GetTicketStatsHandler(ICargoMintDbContext context, ITenantProvider tenantProvider)
    : IRequestHandler<GetTicketStatsQuery, TicketStatsDto>
{
    public async Task<TicketStatsDto> Handle(GetTicketStatsQuery request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        var userId = tenantProvider.UserId;
        var isSuperAdmin = tenantProvider.HasAnyRole(["SuperAdmin", "Admin"]);

        if (!tenantId.HasValue && !isSuperAdmin)
            return new TicketStatsDto(0, 0, 0, 0, 0, 0, 0, 0);

        var query = context.SupportTickets.AsQueryable();
        if (!isSuperAdmin) query = query.Where(t => t.TenantId == tenantId!.Value);

        var total = await query.CountAsync(cancellationToken);
        var open = await query.CountAsync(t => t.Status == TicketStatus.Open || t.Status == TicketStatus.WaitingForTenantAdmin, cancellationToken);
        var inProgress = await query.CountAsync(t => t.Status == TicketStatus.InProgress, cancellationToken);
        var resolved = await query.CountAsync(t => t.Status == TicketStatus.Resolved, cancellationToken);
        var closed = await query.CountAsync(t => t.Status == TicketStatus.Closed, cancellationToken);
        var escalated = await query.CountAsync(t => t.EscalationLevel == EscalationLevel.PlatformSupport && t.Status != TicketStatus.Closed && t.Status != TicketStatus.Resolved, cancellationToken);
        var critical = await query.CountAsync(t => t.Priority == TicketPriority.Critical && t.Status != TicketStatus.Closed && t.Status != TicketStatus.Resolved, cancellationToken);

        var unreadQuery = context.TicketMessages.AsQueryable();
        if (!isSuperAdmin)
        {
            var ticketIds = query.Select(t => t.Id);
            unreadQuery = unreadQuery.Where(m => ticketIds.Contains(m.SupportTicketId) && !m.IsRead && m.SenderUserId != userId);
        }
        else
        {
            unreadQuery = unreadQuery.Where(m => !m.IsRead && m.SenderUserId != userId &&
                context.SupportTickets.Any(t => t.Id == m.SupportTicketId &&
                    t.EscalationLevel == EscalationLevel.PlatformSupport &&
                    t.Status != TicketStatus.Closed));
        }
        var unreadByMe = await unreadQuery.Select(m => m.SupportTicketId).Distinct().CountAsync(cancellationToken);

        return new TicketStatsDto(total, open, inProgress, resolved, closed, escalated, critical, unreadByMe);
    }
}
