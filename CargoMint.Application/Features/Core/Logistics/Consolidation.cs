using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record CreateShipmentGroupCommand(
    int DepartureServiceCentreId,
    int DestinationServiceCentreId,
    List<string> Waybills,
    string? SealNumber = null) : IRequest<string>;

public class ConsolidationHandler(ICargoMintDbContext context) : IRequestHandler<CreateShipmentGroupCommand, string>
{
    public async Task<string> Handle(CreateShipmentGroupCommand request, CancellationToken cancellationToken)
    {
        var groupCode = $"GRP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var group = new ShipmentGroup
        {
            GroupCode = groupCode,
            DepartureServiceCentreId = request.DepartureServiceCentreId,
            DestinationServiceCentreId = request.DestinationServiceCentreId,
            SealNumber = request.SealNumber
        };

        var shipments = await context.Shipments
            .Where(s => request.Waybills.Contains(s.Waybill))
            .ToListAsync(cancellationToken);

        foreach (var shipment in shipments)
        {
            group.Items.Add(new ShipmentGroupItem { ShipmentId = shipment.Id });
        }

        context.ShipmentGroups.Add(group);
        await context.SaveChangesAsync(cancellationToken);

        return groupCode;
    }
}

public record AddShipmentToGroupCommand(string GroupCode, string Waybill) : IRequest<bool>;

public class AddShipmentToGroupHandler(ICargoMintDbContext context) : IRequestHandler<AddShipmentToGroupCommand, bool>
{
    public async Task<bool> Handle(AddShipmentToGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await context.ShipmentGroups
            .Include(g => g.Items)
            .FirstOrDefaultAsync(g => g.GroupCode == request.GroupCode, cancellationToken);
        
        if (group == null) return false;

        var shipment = await context.Shipments
            .FirstOrDefaultAsync(s => s.Waybill == request.Waybill, cancellationToken);
        
        if (shipment == null) return false;

        // "Logical Move" - Remove from any existing group first
        var existingLink = await context.ShipmentGroupItems
            .FirstOrDefaultAsync(i => i.ShipmentId == shipment.Id, cancellationToken);
        
        if (existingLink != null)
        {
            context.ShipmentGroupItems.Remove(existingLink);
        }

        // Add to new group
        group.Items.Add(new ShipmentGroupItem { ShipmentId = shipment.Id });

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
