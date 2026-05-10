using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Pricing;

public record GetPriceQuoteQuery(
    int DepartureStationId, 
    int DestinationStationId, 
    decimal Weight,
    double Length = 0,
    double Width = 0,
    double Height = 0,
    ShipmentType ShipmentType = ShipmentType.Regular,
    bool IsFragile = false,
    bool IsSameDay = false) : IRequest<PriceQuoteResponse?>;

public record PriceQuoteResponse(
    string ZoneName, 
    decimal BasePrice, 
    decimal Vat, 
    decimal Insurance, 
    decimal FuelSurcharge,
    decimal FragileSurcharge,
    decimal SameDaySurcharge,
    decimal GrandTotal,
    string CurrencyCode,
    string CurrencySymbol,
    double BillableWeight,
    string RouteCombination,
    int? EstimatedHoursOfArrival);

public class GetPriceQuoteHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<GetPriceQuoteQuery, PriceQuoteResponse?>
{
    public async Task<PriceQuoteResponse?> Handle(GetPriceQuoteQuery request, CancellationToken cancellationToken)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0) return null;

        // 1. Resolve Stations and Countries
        var depStation = await context.Stations
            .Include(s => s.State!)
            .ThenInclude(st => st.Country!)
            .FirstOrDefaultAsync(s => s.Id == request.DepartureStationId, cancellationToken);
        var destStation = await context.Stations
            .Include(s => s.State!)
            .ThenInclude(st => st.Country!)
            .FirstOrDefaultAsync(s => s.Id == request.DestinationStationId, cancellationToken);

        if (depStation == null || destStation == null) return null;

        var originCountry = depStation.State?.Country;
        var destCountry = destStation.State?.Country;

        if (originCountry == null || destCountry == null) return null;

        // 2. Calculate Billable Weight
        var volumetricWeight = (request.Length * request.Width * request.Height) / 5000;
        var billableWeight = Math.Max((double)request.Weight, volumetricWeight);

        // 3. Resolve Zone (Local vs International)
        int? zoneId = null;
        string zoneName = "Unknown";
        int? estimatedHoursOfArrival = null;
        var routeCombination = $"{depStation.Name} -> {destStation.Name}";

        var tenantId = tenantProvider.TenantId!.Value;
        if (originCountry.Id == destCountry.Id)
        {
            // Local Route (tenant-specific first, then global map managed by Super Admin)
            var map = await context.RouteZoneMaps
                .Include(r => r.Zone)
                .FirstOrDefaultAsync(r => r.DepartureStationId == request.DepartureStationId && r.DestinationStationId == request.DestinationStationId, cancellationToken);
            map ??= await context.RouteZoneMaps
                .IgnoreQueryFilters()
                .Include(r => r.Zone)
                .FirstOrDefaultAsync(
                    r => r.TenantId == 0 &&
                         r.DepartureStationId == request.DepartureStationId &&
                         r.DestinationStationId == request.DestinationStationId,
                    cancellationToken);
            
            zoneId = map?.ZoneId;
            zoneName = map?.Zone?.Name ?? "Local Zone";
            estimatedHoursOfArrival = map?.EstimatedHoursOfArrival;
        }
        else
        {
            // International Route (tenant-specific first, then global map managed by Super Admin)
            var map = await context.CountryRouteZoneMaps
                .Include(r => r.Zone)
                .FirstOrDefaultAsync(r => r.DepartureCountryId == originCountry.Id && r.DestinationCountryId == destCountry.Id, cancellationToken);
            map ??= await context.CountryRouteZoneMaps
                .IgnoreQueryFilters()
                .Include(r => r.Zone)
                .FirstOrDefaultAsync(
                    r => r.TenantId == 0 &&
                         r.DepartureCountryId == originCountry.Id &&
                         r.DestinationCountryId == destCountry.Id,
                    cancellationToken);
            
            zoneId = map?.ZoneId;
            zoneName = map?.Zone?.Name ?? "International Zone";
            estimatedHoursOfArrival = map != null && map.EstimatedDaysOfArrival > 0
                ? map.EstimatedDaysOfArrival * 24
                : null;
        }

        if (zoneId == null)
        {
            if (originCountry.Id == destCountry.Id)
            {
                var fallbackZoneName = depStation.StateId == destStation.StateId ? "Zone 1" : "Zone 4";
                var fallbackZone = await context.Zones
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(z => z.TenantId == 0 && z.Name.StartsWith(fallbackZoneName), cancellationToken);
                zoneId = fallbackZone?.Id;
                zoneName = fallbackZone?.Name ?? "Local Fallback";
                estimatedHoursOfArrival ??= depStation.StateId == destStation.StateId ? 24 : 72;
            }
        }

        if (zoneId == null) return null;

        // Prefer tenant zone by mapped zone name to keep tenant-specific pricing tables authoritative.
        if (!string.IsNullOrWhiteSpace(zoneName))
        {
            var normalizedZoneName = zoneName.Trim().ToLowerInvariant();
            var tenantZoneId = await context.Zones
                .IgnoreQueryFilters()
                .Where(z => z.TenantId == tenantId && z.IsActive && z.Name.ToLower() == normalizedZoneName)
                .Select(z => z.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (tenantZoneId > 0)
            {
                zoneId = tenantZoneId;
            }
        }

        // 4. Find Price (zone price table first)
        var priceEntry = await context.ZonePrices
            .Where(p => p.ZoneId == zoneId && p.ShipmentType == request.ShipmentType && p.Weight >= (decimal)billableWeight)
            .OrderBy(p => p.Weight)
            .FirstOrDefaultAsync(cancellationToken);

        decimal? basePriceOverride = null;
        if (priceEntry == null)
        {
            basePriceOverride = await context.ZoneMatrixRates
                .Where(x => x.OriginZoneId == zoneId.Value && x.DestinationZoneId == zoneId.Value && x.IsActive)
                .Select(x => (decimal?)x.Price)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (priceEntry == null && basePriceOverride is null) return null;

        // 5. Fetch Surcharges & Rules from dedicated table
        var surcharge = await context.TenantSurcharges
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId, cancellationToken);

        // 6. Calculate Totals
        var basePrice = priceEntry?.Price ?? basePriceOverride!.Value;
        
        var vatRate = (surcharge?.VatPercent ?? 7.5m) / 100m;
        var insuranceRate = (surcharge?.InsurancePercent ?? 1.0m) / 100m;
        var fuelSurchargeRate = (surcharge?.FuelSurchargePercent ?? 3.0m) / 100m;
        
        var vat = basePrice * vatRate;
        var insurance = basePrice * insuranceRate;
        var fuelSurcharge = basePrice * fuelSurchargeRate;

        // Optional Surcharges
        decimal fragileSurcharge = 0;
        if (request.IsFragile)
        {
            // Try percentage first, then flat if needed
            fragileSurcharge = (surcharge?.FragileSurchargePercent ?? 25m) / 100m * basePrice;
            if (fragileSurcharge == 0) fragileSurcharge = surcharge?.FragileSurchargeFlat ?? 200m;
        }

        decimal sameDaySurcharge = 0;
        if (request.IsSameDay)
        {
            sameDaySurcharge = surcharge?.SameDaySurchargeFlat ?? 500m;
        }
        
        var grandTotal = basePrice + vat + insurance + fuelSurcharge + fragileSurcharge + sameDaySurcharge;

        // 7. Apply Minimum Charge Rule
        var minCharge = surcharge?.MinimumShipmentCharge ?? 500m;
        if (grandTotal < minCharge)
        {
            grandTotal = minCharge;
        }

        return new PriceQuoteResponse(
            zoneName,
            basePrice,
            vat,
            insurance,
            fuelSurcharge,
            fragileSurcharge,
            sameDaySurcharge,
            grandTotal,
            originCountry.CurrencyCode ?? "USD",
            originCountry.CurrencySymbol ?? "$",
            billableWeight,
            routeCombination,
            estimatedHoursOfArrival
        );
    }

    private static decimal ParsePercent(string? value, decimal defaultValue)
    {
        if (string.IsNullOrWhiteSpace(value)) return defaultValue;
        var clean = value.Replace("%", "").Trim();
        if (decimal.TryParse(clean, out var result)) return result / 100m;
        return defaultValue;
    }

    private static bool TryParseMoney(string? value, out decimal result)
    {
        result = 0;
        if (string.IsNullOrWhiteSpace(value)) return false;
        var clean = value.Replace("NGN", "").Replace("₦", "").Replace(",", "").Trim();
        return decimal.TryParse(clean, out result);
    }
}
