using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Shipment : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(50)]
    public string Waybill { get; set; } = string.Empty;

    // Sender Info
    [Required, MaxLength(50)]
    public string CustomerCode { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; }
    
    // Receiver Info
    [Required, MaxLength(200)]
    public string ReceiverName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string ReceiverPhoneNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ReceiverAddress { get; set; }

    [MaxLength(100)]
    public string? ReceiverEmail { get; set; }

    // Logistics Info
    public int DepartureStationId { get; set; }
    public Station? DepartureStation { get; set; }

    public int DestinationStationId { get; set; }
    public Station? DestinationStation { get; set; }

    public int DepartureServiceCentreId { get; set; }
    public ServiceCentre? DepartureServiceCentre { get; set; }

    public int DestinationServiceCentreId { get; set; }
    public ServiceCentre? DestinationServiceCentre { get; set; }

    public ShipmentOriginType OriginType { get; set; } = ShipmentOriginType.Pickup;
    public ShipmentScanStatus Status { get; set; } = ShipmentScanStatus.ReceivedAtBranch;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    // Financials
    public decimal Total { get; set; }
    public decimal Vat { get; set; }
    public decimal Insurance { get; set; }
    public decimal FuelSurcharge { get; set; }
    public decimal FragileSurcharge { get; set; }
    public decimal SameDaySurcharge { get; set; }
    public decimal DeclaredValue { get; set; }
    public decimal GrandTotal { get; set; }

    public bool IsCashOnDelivery { get; set; }
    public decimal? CashOnDeliveryAmount { get; set; }

    public bool IsDelayed { get; set; }
    public DateTime? EstimatedDeliveryTime { get; set; }

    [MaxLength(100)]
    public string? ExternalTrackingCode { get; set; }
    
    [MaxLength(100)]
    public string? CarrierName { get; set; }

    // Items
    public ICollection<ShipmentItem> Items { get; set; } = new HashSet<ShipmentItem>();

    [MaxLength(500)]
    public string? Description { get; set; }
}

public class ShipmentItem : BaseEntity
{
    public int ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    public int Quantity { get; set; }
    public double Weight { get; set; }

    // Dimensions in CM
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }

    public double VolumetricWeight => (Length * Width * Height) / 5000;
    public double BillableWeight => Math.Max(Weight, VolumetricWeight);

    public decimal Price { get; set; }
}
