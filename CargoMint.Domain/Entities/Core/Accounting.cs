using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Invoice : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public PaymentType PaymentType { get; set; }

    [MaxLength(50)]
    public string? Waybill { get; set; }

    public int ServiceCentreId { get; set; }
    public ServiceCentre? ServiceCentre { get; set; }

    public DateTime? PaymentDate { get; set; }
    public string? PaymentReference { get; set; }
}

public class GeneralLedger : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public decimal Amount { get; set; }
    public CreditDebitType CreditDebitType { get; set; }
    public PaymentType PaymentType { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Waybill { get; set; }

    public int ServiceCentreId { get; set; }
    public ServiceCentre? ServiceCentre { get; set; }

    public bool IsInternational { get; set; }
    public int? CountryId { get; set; }
}
