using CargoMint.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class ShipmentTracking : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }
    
    [Required, MaxLength(50)]
    public string Waybill { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Location { get; set; } = string.Empty;

    [MaxLength(500)]
    public string StatusDescription { get; set; } = string.Empty;

    public DateTime ScanTime { get; set; } = DateTime.UtcNow;
}

public class PreShipment : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string TempCode { get; set; } = string.Empty;

    public int CustomerId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverAddress { get; set; } = string.Empty;

    public bool IsConverted { get; set; } = false;
}
