using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class SupportTicket : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [MaxLength(20)]
    public string TicketNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; }

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;

    public TicketStatus Status { get; set; } = TicketStatus.Open;

    public EscalationLevel EscalationLevel { get; set; } = EscalationLevel.TenantInternal;

    public TicketCreatorRole CreatorRole { get; set; }

    [MaxLength(450)]
    public string CreatedByUserId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? CreatedByUserName { get; set; }

    [MaxLength(200)]
    public string? CreatedByUserEmail { get; set; }

    [MaxLength(450)]
    public string? AssignedToUserId { get; set; }

    [MaxLength(200)]
    public string? AssignedToUserName { get; set; }

    public int? RelatedShipmentId { get; set; }

    [MaxLength(100)]
    public string? RelatedWaybill { get; set; }

    public int? RelatedServiceCentreId { get; set; }

    [MaxLength(450)]
    public string? RelatedCustomerId { get; set; }

    [MaxLength(200)]
    public string? LastMessagePreview { get; set; }

    public DateTime? LastActivityAtUtc { get; set; }

    public DateTime? ClosedAtUtc { get; set; }

    [MaxLength(450)]
    public string? ClosedByUserId { get; set; }

    public List<TicketMessage> Messages { get; } = [];
}

public class TicketMessage : BaseEntity
{
    public int SupportTicketId { get; set; }

    [MaxLength(450)]
    public string SenderUserId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? SenderUserName { get; set; }

    public TicketCreatorRole SenderRole { get; set; }

    [MaxLength(4000)]
    public string Body { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? AttachmentUrl { get; set; }

    public bool IsInternalNote { get; set; }

    public bool IsRead { get; set; }

    public SupportTicket Ticket { get; set; } = null!;
}
