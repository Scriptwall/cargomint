using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Wallet : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string WalletNumber { get; set; } = string.Empty;

    public decimal Balance { get; set; }

    [Required, MaxLength(50)]
    public string CustomerCode { get; set; } = string.Empty;

    public CustomerType CustomerType { get; set; }

    public bool IsSystem { get; set; }
}

public class WalletTransaction : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public int WalletId { get; set; }
    public Wallet? Wallet { get; set; }

    public decimal Amount { get; set; }
    public CreditDebitType CreditDebitType { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Waybill { get; set; }

    public PaymentType PaymentType { get; set; }

    [MaxLength(100)]
    public string? PaymentReference { get; set; }

    public decimal BalanceAfterTransaction { get; set; }

    public int ServiceCentreId { get; set; }
    public ServiceCentre? ServiceCentre { get; set; }

    public int? TransactionCountryId { get; set; }
}
