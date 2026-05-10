using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments.Queries;

public record WaybillPreviewResponse(
    string Waybill,
    string SenderName,
    string SenderPhone,
    string SenderAddress,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string DepartureStation,
    string DestinationStation,
    string DepartureSC,
    string DestinationSC,
    List<WaybillItemDto> Items,
    decimal Total,
    decimal Vat,
    decimal Insurance,
    decimal FuelSurcharge,
    decimal FragileSurcharge,
    decimal SameDaySurcharge,
    decimal GrandTotal,
    bool IsCashOnDelivery,
    decimal CodAmount,
    DateTime CreatedAt,
    string BarcodeData);

public record WaybillItemDto(string Description, int Quantity, double Weight);

public record GetWaybillPreviewQuery(string Waybill) : IRequest<WaybillPreviewResponse?>;

public class GetWaybillPreviewHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider) : IRequestHandler<GetWaybillPreviewQuery, WaybillPreviewResponse?>
{
    public async Task<WaybillPreviewResponse?> Handle(GetWaybillPreviewQuery request, CancellationToken cancellationToken)
    {
        var shipment = await context.Shipments
            .Include(s => s.Items)
            .Include(s => s.DepartureStation)
            .Include(s => s.DestinationStation)
            .Include(s => s.DepartureServiceCentre)
            .Include(s => s.DestinationServiceCentre)
            .FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);

        if (shipment == null) return null;

        // Resolve Sender Info from CustomerCode
        string senderName = "Unknown";
        string senderPhone = "N/A";
        string senderAddress = "N/A";

        if (shipment.CustomerType == CustomerType.Company)
        {
            var company = await context.Companies.FirstOrDefaultAsync(c => c.CustomerCode == shipment.CustomerCode, cancellationToken);
            if (company != null)
            {
                senderName = company.Name;
                senderPhone = company.PhoneNumber;
                senderAddress = company.Address ?? "N/A";
            }
        }
        else
        {
            var individual = await context.IndividualCustomers.FirstOrDefaultAsync(c => c.CustomerCode == shipment.CustomerCode, cancellationToken);
            if (individual != null)
            {
                senderName = $"{individual.FirstName} {individual.LastName}";
                senderPhone = individual.PhoneNumber;
                senderAddress = individual.Address ?? "N/A";
            }
        }

        return new WaybillPreviewResponse(
            shipment.Waybill,
            senderName,
            senderPhone,
            senderAddress,
            shipment.ReceiverName,
            shipment.ReceiverPhoneNumber,
            shipment.ReceiverAddress ?? "N/A",
            shipment.DepartureStation?.Name ?? "N/A",
            shipment.DestinationStation?.Name ?? "N/A",
            shipment.DepartureServiceCentre?.Name ?? "N/A",
            shipment.DestinationServiceCentre?.Name ?? "N/A",
            shipment.Items.Select(i => new WaybillItemDto(i.Description, i.Quantity, i.Weight)).ToList(),
            shipment.Total,
            shipment.Vat,
            shipment.Insurance,
            shipment.FuelSurcharge,
            shipment.FragileSurcharge,
            shipment.SameDaySurcharge,
            shipment.GrandTotal,
            shipment.IsCashOnDelivery,
            shipment.CashOnDeliveryAmount ?? 0,
            shipment.CreatedAt,
            shipment.Waybill // For now the barcode is just the waybill string
        );
    }
}
