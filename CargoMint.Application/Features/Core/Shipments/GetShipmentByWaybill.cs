using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments;

public record GetShipmentByWaybillQuery(string Waybill) : IRequest<ShipmentDetailResponse?>;

public record ShipmentDetailResponse(
    string Waybill, 
    string ReceiverName, 
    string ReceiverPhoneNumber,
    ShipmentScanStatus Status,
    decimal GrandTotal,
    List<ShipmentItemDetail> Items);

public record ShipmentItemDetail(string Description, int Quantity, double Weight);

public class GetShipmentByWaybillHandler(
    ICargoMintDbContext context) : IRequestHandler<GetShipmentByWaybillQuery, ShipmentDetailResponse?>
{
    public async Task<ShipmentDetailResponse?> Handle(GetShipmentByWaybillQuery request, CancellationToken cancellationToken)
    {
        return await context.Shipments
            .AsNoTracking()
            .Include(s => s.Items)
            .Where(s => s.Waybill == request.Waybill)
            .Select(s => new ShipmentDetailResponse(
                s.Waybill,
                s.ReceiverName,
                s.ReceiverPhoneNumber,
                s.Status,
                s.GrandTotal,
                s.Items.Select(i => new ShipmentItemDetail(i.Description, i.Quantity, i.Weight)).ToList()
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
