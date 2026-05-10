using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments;

public record UpdateShipmentCommand(
    string Waybill,
    string ReceiverName,
    string ReceiverPhoneNumber,
    string ReceiverAddress,
    string ReceiverEmail) : IRequest<bool>;

public class UpdateShipmentHandler(ICargoMintDbContext context) : IRequestHandler<UpdateShipmentCommand, bool>
{
    public async Task<bool> Handle(UpdateShipmentCommand request, CancellationToken cancellationToken)
    {
        var shipment = await context.Shipments.FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);
        if (shipment == null) return false;

        shipment.ReceiverName = request.ReceiverName;
        shipment.ReceiverPhoneNumber = request.ReceiverPhoneNumber;
        shipment.ReceiverAddress = request.ReceiverAddress;
        shipment.ReceiverEmail = request.ReceiverEmail;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record UpdateShipmentStatusCommand(
    string Waybill,
    ShipmentScanStatus Status) : IRequest<bool>;

public class UpdateShipmentStatusHandler(ICargoMintDbContext context) : IRequestHandler<UpdateShipmentStatusCommand, bool>
{
    public async Task<bool> Handle(UpdateShipmentStatusCommand request, CancellationToken cancellationToken)
    {
        var shipment = await context.Shipments.FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);
        if (shipment == null) return false;

        shipment.Status = request.Status;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
