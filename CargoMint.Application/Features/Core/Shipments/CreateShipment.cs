using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using CargoMint.Domain.Exceptions;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CargoMint.Application.Features.Core.Shipments;

public record CreateShipmentCommand(
    string? CustomerCode,
    CustomerType CustomerType,
    string? SenderName,
    string? SenderPhoneNumber,
    string? SenderEmail,
    string? SenderAddress,
    string ReceiverName,
    string ReceiverPhoneNumber,
    string ReceiverAddress,
    string? ReceiverEmail,
    int DepartureStationId,
    int DestinationStationId,
    List<ShipmentItemRequest> Items,
    decimal DeclaredValue = 0,
    bool ApplyInsurance = false,
    ShipmentOriginType OriginType = ShipmentOriginType.Dropoff,
    bool IsCashOnDelivery = false,
    bool IsFragile = false,
    bool IsSameDay = false,
    double Length = 0,
    double Width = 0,
    double Height = 0) : IRequest<ShipmentResponse>;

public record ShipmentItemRequest(string Description, int Quantity, double Weight, decimal Price);

public record ShipmentResponse(string Waybill, decimal GrandTotal);

public class CreateShipmentHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider,
    IMediator mediator) : IRequestHandler<CreateShipmentCommand, ShipmentResponse>
{
    public async Task<ShipmentResponse> Handle(CreateShipmentCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantProvider.TenantId;
        if (!tenantId.HasValue) throw new UnauthorizedAccessException();

        var resolvedCustomerCode = await ResolveOrCreateCustomerCodeAsync(request, cancellationToken);

        // 1. Resolve Stations and SCs
        var depSc = await context.ServiceCentres
            .FirstOrDefaultAsync(s => s.StationId == request.DepartureStationId && s.IsActive && !s.IsDeleted, cancellationToken);
        var destSc = await context.ServiceCentres
            .FirstOrDefaultAsync(s => s.StationId == request.DestinationStationId && s.IsActive && !s.IsDeleted, cancellationToken);

        if (depSc == null || destSc == null)
            throw new BusinessRuleException("Origin or destination station is not linked to an active service centre for your tenant.");

        // 2. Calculate Pricing via GetPriceQuote
        var weight = (decimal)request.Items.Sum(x => x.Weight * x.Quantity);
        var quote = await mediator.Send(new Pricing.GetPriceQuoteQuery(
            request.DepartureStationId,
            request.DestinationStationId,
            weight,
            Length: request.Length,
            Width: request.Width,
            Height: request.Height,
            IsFragile: request.IsFragile,
            IsSameDay: request.IsSameDay), cancellationToken);

        if (quote == null) throw new BusinessRuleException("Pricing could not be resolved for this route. Please check if the route is active and has a price matrix defined in the pricing engine.");

        // 3. Generate Waybill
        var waybill = $"WB{DateTime.UtcNow:yyyyMMdd}{Guid.NewGuid().ToString()[..6].ToUpper()}";

        // 4. Create Shipment Entity
        var shipment = new Shipment
        {
            TenantId = tenantId.Value,
            Waybill = waybill,
            CustomerCode = resolvedCustomerCode,
            CustomerType = request.CustomerType,
            ReceiverName = request.ReceiverName,
            ReceiverPhoneNumber = request.ReceiverPhoneNumber,
            ReceiverAddress = request.ReceiverAddress,
            ReceiverEmail = request.ReceiverEmail,
            DepartureStationId = request.DepartureStationId,
            DestinationStationId = request.DestinationStationId,
            DepartureServiceCentreId = depSc.Id,
            DestinationServiceCentreId = destSc.Id,
            OriginType = request.OriginType,
            Status = request.OriginType == ShipmentOriginType.Pickup 
                ? ShipmentScanStatus.Processing 
                : ShipmentScanStatus.ReceivedAtBranch,
            Total = quote.BasePrice,
            Vat = quote.Vat,
            Insurance = request.ApplyInsurance ? quote.Insurance : 0,
            FuelSurcharge = quote.FuelSurcharge,
            FragileSurcharge = quote.FragileSurcharge,
            SameDaySurcharge = quote.SameDaySurcharge,
            DeclaredValue = request.DeclaredValue,
            GrandTotal = quote.GrandTotal,
            IsCashOnDelivery = request.IsCashOnDelivery,
            CashOnDeliveryAmount = request.IsCashOnDelivery ? quote.GrandTotal : 0
        };

        // 5. Map Items
        foreach (var item in request.Items)
        {
            shipment.Items.Add(new ShipmentItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                Weight = item.Weight,
                Price = item.Price > 0 ? item.Price : (request.Items.Sum(i => i.Quantity) > 0 ? quote.BasePrice / request.Items.Sum(i => i.Quantity) : 0) // Distribute base price if item price not set
            });
        }

        // 6. Save Shipment
        context.Shipments.Add(shipment);
        await context.SaveChangesAsync(cancellationToken);

        // 6.5. Audit Log
        // AuditLog is now an enterprise feature handled via domain events or enterprise application layer.
        // context.AuditLogs.Add(new AuditLog
        // {
        //     TableName = "Shipment",
        //     EntityId = shipment.Id.ToString(),
        //     Action = "Create",
        //     NewValues = JsonSerializer.Serialize(new { Waybill = shipment.Waybill, GrandTotal = shipment.GrandTotal, CustomerCode = resolvedCustomerCode }),
        //     UserId = "system",
        //     TenantId = tenantId.Value
        // });

        // 7. Auto-Consolidation (Group for sorting)
        var openGroup = await context.ShipmentGroups
            .Where(g => g.DepartureServiceCentreId == shipment.DepartureServiceCentreId && 
                        g.DestinationServiceCentreId == shipment.DestinationServiceCentreId)
            .OrderByDescending(g => g.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (openGroup == null)
        {
            openGroup = new ShipmentGroup
            {
                TenantId = tenantId.Value,
                GroupCode = $"AUTO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}",
                DepartureServiceCentreId = shipment.DepartureServiceCentreId,
                DestinationServiceCentreId = shipment.DestinationServiceCentreId
            };
            context.ShipmentGroups.Add(openGroup);
        }

        openGroup.Items.Add(new ShipmentGroupItem { ShipmentId = shipment.Id });
        await context.SaveChangesAsync(cancellationToken);

        return new ShipmentResponse(waybill, shipment.GrandTotal);
    }

    private async Task<string> ResolveOrCreateCustomerCodeAsync(CreateShipmentCommand request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.CustomerCode) && request.CustomerCode != "IND-001")
        {
            return request.CustomerCode.Trim();
        }

        var normalizedName = request.SenderName?.Trim() ?? string.Empty;
        var normalizedPhone = request.SenderPhoneNumber?.Trim() ?? string.Empty;
        var normalizedEmail = request.SenderEmail?.Trim() ?? string.Empty;
        var normalizedAddress = request.SenderAddress?.Trim();

        if (request.CustomerType == CustomerType.Company)
        {
            var existingCompany = await context.Companies
                .FirstOrDefaultAsync(
                    c => (!string.IsNullOrWhiteSpace(normalizedPhone) && c.PhoneNumber == normalizedPhone) ||
                         (!string.IsNullOrWhiteSpace(normalizedName) && c.Name.ToUpper() == normalizedName.ToUpper()),
                    cancellationToken);

            if (existingCompany != null) return existingCompany.CustomerCode;

            var companyCode = $"COM-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
            var newCompany = new Company
            {
                Name = string.IsNullOrWhiteSpace(normalizedName) ? "Walk-in Merchant" : normalizedName,
                Email = string.IsNullOrWhiteSpace(normalizedEmail) ? $"merchant-{companyCode.ToLower()}@local.cargomint" : normalizedEmail,
                PhoneNumber = string.IsNullOrWhiteSpace(normalizedPhone) ? "WALKM-" + Guid.NewGuid().ToString("N")[..6].ToUpper() : normalizedPhone,
                Address = normalizedAddress,
                CustomerCode = companyCode,
                CompanyType = Domain.Enums.CompanyType.Corporate,
                TenantId = tenantProvider.TenantId!.Value
            };

            context.Companies.Add(newCompany);
            await context.SaveChangesAsync(cancellationToken);
            return newCompany.CustomerCode;
        }

        var existingCustomer = await context.IndividualCustomers
            .FirstOrDefaultAsync(
                c => (!string.IsNullOrWhiteSpace(normalizedPhone) && c.PhoneNumber == normalizedPhone) ||
                     (string.IsNullOrWhiteSpace(normalizedPhone) && c.FirstName == "Walk-in" && c.LastName == "Customer"),
                cancellationToken);

        if (existingCustomer != null) return existingCustomer.CustomerCode;

        var firstName = "Walk-in";
        var lastName = "Customer";
        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            var parts = normalizedName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            firstName = parts[0];
            lastName = parts.Length > 1 ? string.Join(' ', parts.Skip(1)) : "Customer";
        }

        var customerCode = $"IND-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        var customer = new IndividualCustomer
        {
            FirstName = firstName,
            LastName = lastName,
            Email = string.IsNullOrWhiteSpace(normalizedEmail) ? $"customer-{customerCode.ToLower()}@local.cargomint" : normalizedEmail,
            PhoneNumber = string.IsNullOrWhiteSpace(normalizedPhone) ? "WALKIN" + Guid.NewGuid().ToString("N")[..6].ToUpper() : normalizedPhone,
            Address = normalizedAddress,
            CustomerCode = customerCode,
            IsActive = true,
            TenantId = tenantProvider.TenantId!.Value
        };

        context.IndividualCustomers.Add(customer);
        await context.SaveChangesAsync(cancellationToken);
        return customer.CustomerCode;
    }
}
