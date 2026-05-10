using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Company : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? RcNumber { get; set; }

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    public CompanyType CompanyType { get; set; }
    public CompanyStatus Status { get; set; } = CompanyStatus.Active;
    public CustomerCategory Category { get; set; } = CustomerCategory.Regular;

    [Required, MaxLength(50)]
    public string CustomerCode { get; set; } = string.Empty;

    public decimal Discount { get; set; }
    public int SettlementPeriod { get; set; }
    public bool IsCodEnabled { get; set; }

    // Bank Details
    [MaxLength(100)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? AccountNumber { get; set; }

    [MaxLength(100)]
    public string? AccountName { get; set; }

    [MaxLength(20)]
    public string? BVN { get; set; }

    // Contact Person Info (Consolidated for now)
    [MaxLength(100)]
    public string? ContactFirstName { get; set; }

    [MaxLength(100)]
    public string? ContactLastName { get; set; }
}
