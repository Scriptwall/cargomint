using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Zone : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class ZonePrice : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public int ZoneId { get; set; }
    public Zone? Zone { get; set; }

    public decimal Weight { get; set; }
    public decimal Price { get; set; }

    public ShipmentType ShipmentType { get; set; }
}

public class RouteZoneMap : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public int DepartureStationId { get; set; }
    public Station? DepartureStation { get; set; }

    public int DestinationStationId { get; set; }
    public Station? DestinationStation { get; set; }

    public int ZoneId { get; set; }
    public Zone? Zone { get; set; }

    public int EstimatedHoursOfArrival { get; set; }
}

public class CountryRouteZoneMap : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public int DepartureCountryId { get; set; }
    public Country? DepartureCountry { get; set; }

    public int DestinationCountryId { get; set; }
    public Country? DestinationCountry { get; set; }

    public int ZoneId { get; set; }
    public Zone? Zone { get; set; }

    public int EstimatedDaysOfArrival { get; set; }
}

public class ZoneMatrixRate : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    public int OriginZoneId { get; set; }
    public Zone? OriginZone { get; set; }

    public int DestinationZoneId { get; set; }
    public Zone? DestinationZone { get; set; }

    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>Per-merchant contractual rate overrides negotiated by TenantAdmin.</summary>
public class MerchantContractRateCard : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(100)]
    public string MerchantCode { get; set; } = string.Empty;

    public int ZoneId { get; set; }
    public Zone? Zone { get; set; }

    public ShipmentType ShipmentType { get; set; }

    /// <summary>Flat override price per kg in the zone. Null = use default zone price.</summary>
    public decimal? OverridePrice { get; set; }

    /// <summary>Percentage discount on base zone price (0–100).</summary>
    public decimal? DiscountPercent { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Effective date range for this rate card.</summary>
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveTo { get; set; }
}

/// <summary>API keys issued to merchants for programmatic shipment creation.</summary>
public class MerchantApiKey : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(100)]
    public string MerchantCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string KeyName { get; set; } = string.Empty;

    /// <summary>SHA-256 hash of the raw key. Never store the raw key.</summary>
    [Required, MaxLength(64)]
    public string KeyHash { get; set; } = string.Empty;

    /// <summary>First 8 chars of raw key for display (mask the rest).</summary>
    [MaxLength(8)]
    public string KeyPrefix { get; set; } = string.Empty;

    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>Merchant-registered webhook endpoints for event delivery.</summary>
public class MerchantWebhook : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    [Required, MaxLength(100)]
    public string MerchantCode { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Secret { get; set; }

    /// <summary>Comma-separated event list, e.g. "shipment.created,shipment.delivered".</summary>
    [MaxLength(500)]
    public string Events { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

/// <summary>Tenant-specific surcharges and billing configurations.</summary>
public class TenantSurcharge : BaseEntity, IMustHaveTenant
{
    public int TenantId { get; set; }

    // Surcharges
    public decimal FuelSurchargePercent { get; set; } = 8m;
    public decimal FragileSurchargeFlat { get; set; } = 200m;
    public decimal FragileSurchargePercent { get; set; } = 25m;
    public decimal SameDaySurchargeFlat { get; set; } = 500m;
    public decimal HandlingFeeFlat { get; set; } = 150m;
    public decimal CodFeePercent { get; set; } = 1.2m;
    public decimal ExpressSurchargePercent { get; set; } = 40m;
    public decimal VatPercent { get; set; } = 7.5m;
    public decimal InsurancePercent { get; set; } = 1.5m;
    public decimal MinimumShipmentCharge { get; set; } = 500m;

    // Billing Rules
    [MaxLength(50)]
    public string CodRemittanceCycle { get; set; } = "Weekly"; // Daily, Weekly, Monthly

    [MaxLength(50)]
    public string InvoiceGeneration { get; set; } = "Auto - end of month";

    public decimal LatePaymentPenaltyPercent { get; set; } = 0.5m;
    public int CreditTermDays { get; set; } = 30;
    public int AutoSuspendOverdueDays { get; set; } = 7;

    public bool IsActive { get; set; } = true;
}
