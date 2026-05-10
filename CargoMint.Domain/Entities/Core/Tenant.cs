using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Tenant : BaseEntity
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Identifier { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    
    public TenantOperationalType OperationalType { get; set; } = TenantOperationalType.Logistics;
    
    public DateTime? SuspendedAt { get; set; }
    public string? SuspendReason { get; set; }
}
