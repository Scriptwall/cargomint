using CargoMint.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public enum FleetType
{
    Bike,
    Van,
    Truck,
    OceanFreight,
    AirFreight
}

public enum ManifestStatus
{
    Pending,
    Dispatched,
    Received,
    Cancelled
}

public class Fleet : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string RegistrationNumber { get; set; } = string.Empty;

    public FleetType FleetType { get; set; }
    public int Capacity { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsUnderMaintenance { get; set; }

    [MaxLength(100)]
    public string? Make { get; set; }

    [MaxLength(100)]
    public string? Model { get; set; }

    [MaxLength(100)]
    public string? Ownership { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public int? ServiceCentreId { get; set; }
    public ServiceCentre? ServiceCentre { get; set; }

    public int? AssignedCaptainId { get; set; }
    public Captain? AssignedCaptain { get; set; }

    public ICollection<MaintenanceLog> MaintenanceLogs { get; set; } = new HashSet<MaintenanceLog>();
}

public class MaintenanceLog : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }
    
    public int FleetId { get; set; }
    public Fleet? Fleet { get; set; }

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public decimal Cost { get; set; }
    public DateTime MaintenanceDate { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? WorkshopName { get; set; }
}

public class Captain : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }

    [Required, MaxLength(50)]
    public string CaptainCode { get; set; } = string.Empty;

    public bool IsAvailable { get; set; } = true;

    /// <summary>Set by TenantAdmin/HubManager when captain fails compliance check. Blocks dispatch.</summary>
    public bool IsComplianceLocked { get; set; }

    [MaxLength(500)]
    public string? ComplianceLockReason { get; set; }
}

public class FleetTrip : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string TripCode { get; set; } = string.Empty;

    public int FleetId { get; set; }
    public Fleet? Fleet { get; set; }

    public int CaptainId { get; set; }
    public Captain? Captain { get; set; }

    public DateTime DepartureTime { get; set; }
    public DateTime? ArrivalTime { get; set; }

    public decimal FuelCosts { get; set; }
    public decimal DistanceTravelled { get; set; }

    public ICollection<Manifest> Manifests { get; set; } = new HashSet<Manifest>();
}

public class Manifest : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string ManifestCode { get; set; } = string.Empty;

    public DateTime DateTime { get; set; } = DateTime.UtcNow;

    public int? FleetId { get; set; }
    public Fleet? Fleet { get; set; }

    public int? CaptainId { get; set; }
    public Captain? Captain { get; set; }

    public int? FleetTripId { get; set; }
    public FleetTrip? FleetTrip { get; set; }

    public int DepartureServiceCentreId { get; set; }
    public ServiceCentre? DepartureServiceCentre { get; set; }

    public int DestinationServiceCentreId { get; set; }
    public ServiceCentre? DestinationServiceCentre { get; set; }

    public ManifestStatus Status { get; set; } = ManifestStatus.Pending;
    public bool IsDispatched { get; set; }
    public bool IsReceived { get; set; }

    public ICollection<ManifestItem> Items { get; set; } = new HashSet<ManifestItem>();
}

public class ManifestItem : BaseEntity
{
    public int ManifestId { get; set; }
    public Manifest? Manifest { get; set; }

    public int? ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public int? ShipmentGroupId { get; set; }
    public ShipmentGroup? ShipmentGroup { get; set; }

    [MaxLength(50)]
    public string? WaybillOrGroupCode { get; set; }
}

public class ShipmentGroup : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string GroupCode { get; set; } = string.Empty;

    public int DepartureServiceCentreId { get; set; }
    public int DestinationServiceCentreId { get; set; }

    [MaxLength(50)]
    public string? SealNumber { get; set; }

    public ICollection<ShipmentGroupItem> Items { get; set; } = new HashSet<ShipmentGroupItem>();
}

public class ShipmentGroupItem : BaseEntity
{
    public int ShipmentGroupId { get; set; }
    public ShipmentGroup? ShipmentGroup { get; set; }

    public int ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }
}

public class TenantRolePermission : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(100)]
    public string RoleName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string PermissionKey { get; set; } = string.Empty;

    public bool IsEnabled { get; set; }
}
