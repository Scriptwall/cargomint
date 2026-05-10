using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments;

public record CancelShipmentCommand(string Waybill, string Reason) : IRequest<bool>;
public record ReturnToSenderCommand(string Waybill, string Reason) : IRequest<string>;

public class SpecializedShipmentHandler(ICargoMintDbContext context) : 
    IRequestHandler<CancelShipmentCommand, bool>,
    IRequestHandler<ReturnToSenderCommand, string>
{
    public async Task<bool> Handle(CancelShipmentCommand request, CancellationToken cancellationToken)
    {
        var shipment = await context.Shipments
            .FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);
        
        if (shipment == null) return false;

        // 1. Update Status
        shipment.Status = ShipmentScanStatus.Cancelled;
        
        // 2. Logic for automatic Refund can be plugged in here if it was prepaid from Wallet
        
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<string> Handle(ReturnToSenderCommand request, CancellationToken cancellationToken)
    {
        var original = await context.Shipments
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);
            
        if (original == null) throw new Exception("Shipment not found");

        // 1. Mark original as Returned
        original.Status = ShipmentScanStatus.ReturnedByCustomer;

        // 2. Generate Return Waybill
        var returnWaybill = $"RTS-{original.Waybill}";
        
        // 3. Logic to create a new Shipment linked to the original for tracking reverse logistics
        
        await context.SaveChangesAsync(cancellationToken);
        return returnWaybill;
    }
}
