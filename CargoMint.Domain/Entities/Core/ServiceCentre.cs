using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class ServiceCentre : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public ServiceCentreType Type { get; set; } = ServiceCentreType.ServiceCentre;
    public bool IsHub { get; set; }
    public bool IsGateway { get; set; }
    public bool IsPublic { get; set; }
    public int? ParentHubId { get; set; }
    public ServiceCentre? ParentHub { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public int StationId { get; set; }
    public Station? Station { get; set; }

    public decimal MonthlyTarget { get; set; }

    [MaxLength(100)]
    public string? AccountNumber { get; set; }
}
