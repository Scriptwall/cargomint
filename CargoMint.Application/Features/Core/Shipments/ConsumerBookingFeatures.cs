using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments;

// ─── Step 1: Initiate ─────────────────────────────────────────────────────────

public record BookingItemInput(string Description, int Quantity, double Weight, double Length, double Width, double Height);

public record InitiateBookingCommand(
    string SenderName,
    string SenderPhone,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? ReceiverEmail,
    int DepartureServiceCentreId,
    int DestinationServiceCentreId,
    List<BookingItemInput> Items,
    bool IsCashOnDelivery = false) : IRequest<BookingSessionDto>;

public record BookingSessionDto(
    string SessionId,
    string SenderName,
    string ReceiverName,
    int DepartureServiceCentreId,
    int DestinationServiceCentreId,
    List<BookingItemInput> Items,
    bool IsCashOnDelivery);

// ─── Step 2: Quote ────────────────────────────────────────────────────────────

public record GetBookingQuoteQuery(string SessionId) : IRequest<BookingQuoteDto?>;

public record BookingQuoteLineItem(string Description, double BillableWeightKg, decimal BaseRate);

public record BookingQuoteDto(
    string SessionId,
    string ZoneName,
    List<BookingQuoteLineItem> LineItems,
    decimal SubTotal,
    decimal VatAmount,
    decimal InsuranceAmount,
    decimal GrandTotal,
    string CurrencyCode,
    string CurrencySymbol,
    double TotalBillableWeight,
    bool IsCashOnDelivery);

// ─── Step 3: Confirm ──────────────────────────────────────────────────────────

public record ConfirmBookingCommand(
    string SessionId,
    string SenderName,
    string SenderPhone,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? ReceiverEmail,
    int DepartureServiceCentreId,
    int DestinationServiceCentreId,
    List<BookingItemInput> Items,
    bool IsCashOnDelivery,
    string PaymentMethod) : IRequest<BookingConfirmationDto>;

public record BookingConfirmationDto(
    string Waybill,
    decimal GrandTotal,
    string PaymentMethod,
    string TrackingUrl);

// ─── Handlers ─────────────────────────────────────────────────────────────────

public class ConsumerBookingHandler(ICargoMintDbContext context, ITenantProvider tenantProvider)
    : IRequestHandler<InitiateBookingCommand, BookingSessionDto>,
      IRequestHandler<GetBookingQuoteQuery, BookingQuoteDto?>,
      IRequestHandler<ConfirmBookingCommand, BookingConfirmationDto>
{
    // Step 1 — stateless: wrap inputs in a signed session token (base64 JSON)
    public Task<BookingSessionDto> Handle(
        InitiateBookingCommand request, CancellationToken cancellationToken)
    {
        // Session ID encodes the parameters — no DB write needed (stateless)
        var sessionId = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes(
                System.Text.Json.JsonSerializer.Serialize(request)));

        var dto = new BookingSessionDto(
            sessionId,
            request.SenderName,
            request.ReceiverName,
            request.DepartureServiceCentreId,
            request.DestinationServiceCentreId,
            request.Items,
            request.IsCashOnDelivery);

        return Task.FromResult(dto);
    }

    // Step 2 — decode session, re-run pricing, return itemized quote
    public async Task<BookingQuoteDto?> Handle(
        GetBookingQuoteQuery request, CancellationToken cancellationToken)
    {
        var cmd = DecodeSession<InitiateBookingCommand>(request.SessionId);
        if (cmd == null) return null;

        return await BuildQuote(request.SessionId, cmd, cancellationToken);
    }

    // Step 3 — re-decode + re-price, create shipment
    public async Task<BookingConfirmationDto> Handle(
        ConfirmBookingCommand request, CancellationToken cancellationToken)
    {
        // Re-encode to session format for pricing reuse
        var asInitiate = new InitiateBookingCommand(
            request.SenderName, request.SenderPhone,
            request.ReceiverName, request.ReceiverPhone,
            request.ReceiverAddress, request.ReceiverEmail,
            request.DepartureServiceCentreId, request.DestinationServiceCentreId,
            request.Items, request.IsCashOnDelivery);

        var quote = await BuildQuote(request.SessionId, asInitiate, cancellationToken);
        if (quote == null) throw new InvalidOperationException("Unable to price this booking.");

        var waybill = $"CM{DateTime.UtcNow:yyyyMMdd}{Guid.NewGuid().ToString()[..6].ToUpper()}";

        var shipment = new Shipment
        {
            Waybill = waybill,
            CustomerCode = request.SenderPhone,
            CustomerType = CustomerType.Individual,
            ReceiverName = request.ReceiverName,
            ReceiverPhoneNumber = request.ReceiverPhone,
            ReceiverAddress = request.ReceiverAddress,
            ReceiverEmail = request.ReceiverEmail,
            DepartureServiceCentreId = request.DepartureServiceCentreId,
            DestinationServiceCentreId = request.DestinationServiceCentreId,
            OriginType = ShipmentOriginType.Pickup,
            Status = ShipmentScanStatus.Processing,
            Total = quote.SubTotal,
            Vat = quote.VatAmount,
            Insurance = quote.InsuranceAmount,
            GrandTotal = quote.GrandTotal,
            IsCashOnDelivery = request.IsCashOnDelivery,
            CashOnDeliveryAmount = request.IsCashOnDelivery ? quote.GrandTotal : 0
        };

        foreach (var item in request.Items)
        {
            shipment.Items.Add(new ShipmentItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                Weight = item.Weight,
                Price = quote.LineItems
                    .FirstOrDefault(l => l.Description == item.Description)?.BaseRate ?? 0
            });
        }

        context.Shipments.Add(shipment);

        context.ShipmentTrackings.Add(new ShipmentTracking
        {
            Waybill = waybill,
            Location = "Consumer Booking",
            StatusDescription = "Created",
            ScanTime = DateTime.UtcNow
        });

        await context.SaveChangesAsync(cancellationToken);

        return new BookingConfirmationDto(
            waybill,
            quote.GrandTotal,
            request.PaymentMethod,
            $"/track/{waybill}");
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private async Task<BookingQuoteDto?> BuildQuote(
        string sessionId,
        InitiateBookingCommand cmd,
        CancellationToken cancellationToken)
    {
        var dep = await context.Stations
            .Include(s => s.State!).ThenInclude(st => st.Country!)
            .FirstOrDefaultAsync(s => s.Id == cmd.DepartureServiceCentreId, cancellationToken);
        var dest = await context.Stations
            .Include(s => s.State!).ThenInclude(st => st.Country!)
            .FirstOrDefaultAsync(s => s.Id == cmd.DestinationServiceCentreId, cancellationToken);

        if (dep == null || dest == null) return null;

        var originCountry = dep.State?.Country;
        var destCountry = dest.State?.Country;
        if (originCountry == null || destCountry == null) return null;

        // Resolve zone
        int? zoneId;
        string zoneName;
        var tenantId = tenantProvider.TenantId ?? 0;
        if (originCountry.Id == destCountry.Id)
        {
            var map = await context.RouteZoneMaps.Include(r => r.Zone)
                .FirstOrDefaultAsync(r =>
                    r.DepartureStationId == cmd.DepartureServiceCentreId &&
                    r.DestinationStationId == cmd.DestinationServiceCentreId, cancellationToken);
            map ??= await context.RouteZoneMaps
                .IgnoreQueryFilters()
                .Include(r => r.Zone)
                .FirstOrDefaultAsync(
                    r => r.TenantId == 0 &&
                         r.DepartureStationId == cmd.DepartureServiceCentreId &&
                         r.DestinationStationId == cmd.DestinationServiceCentreId,
                    cancellationToken);
            zoneId = map?.ZoneId;
            zoneName = map?.Zone?.Name ?? "Local Zone";
        }
        else
        {
            var map = await context.CountryRouteZoneMaps.Include(r => r.Zone)
                .FirstOrDefaultAsync(r =>
                    r.DepartureCountryId == originCountry.Id &&
                    r.DestinationCountryId == destCountry.Id, cancellationToken);
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
        }

        if (zoneId == null) return null;

        if (tenantId > 0 && !string.IsNullOrWhiteSpace(zoneName))
        {
            var normalizedZone = zoneName.Trim().ToLowerInvariant();
            var tenantZoneId = await context.Zones
                .IgnoreQueryFilters()
                .Where(z => z.TenantId == tenantId && z.IsActive && z.Name.ToLower() == normalizedZone)
                .Select(z => z.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (tenantZoneId > 0)
            {
                zoneId = tenantZoneId;
            }
        }

        var lineItems = new List<BookingQuoteLineItem>();
        decimal subTotal = 0;
        double totalBillable = 0;

        foreach (var item in cmd.Items)
        {
            var volumetric = (item.Length * item.Width * item.Height) / 5000;
            var billable = Math.Max(item.Weight, volumetric) * item.Quantity;
            totalBillable += billable;

            var priceEntry = await context.ZonePrices
                .Where(p => p.ZoneId == zoneId && p.Weight >= (decimal)billable)
                .OrderBy(p => p.Weight)
                .FirstOrDefaultAsync(cancellationToken);

            var itemRate = priceEntry?.Price ?? 0m;
            subTotal += itemRate;
            lineItems.Add(new BookingQuoteLineItem(item.Description, billable, itemRate));
        }

        var vat = subTotal * 0.075m;
        var insurance = subTotal * 0.01m;
        var grandTotal = subTotal + vat + insurance;

        return new BookingQuoteDto(
            sessionId,
            zoneName,
            lineItems,
            subTotal,
            vat,
            insurance,
            grandTotal,
            originCountry.CurrencyCode ?? "NGN",
            originCountry.CurrencySymbol ?? "₦",
            totalBillable,
            cmd.IsCashOnDelivery);
    }

    private static T? DecodeSession<T>(string sessionId)
    {
        try
        {
            var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(sessionId));
            return System.Text.Json.JsonSerializer.Deserialize<T>(json);
        }
        catch
        {
            return default;
        }
    }
}
