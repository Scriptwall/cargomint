using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class IndividualCustomer : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    public Gender Gender { get; set; } = Gender.Unknown;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    [Required, MaxLength(50)]
    public string CustomerCode { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    
    public int? RegisteredCountryId { get; set; }
}
