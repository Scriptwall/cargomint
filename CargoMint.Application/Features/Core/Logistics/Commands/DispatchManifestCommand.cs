using CargoMint.Application.Interfaces;
using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics.Commands;

public record DispatchManifestCommand(string ManifestCode) : IRequest<bool>;

public class DispatchManifestHandler(ICargoMintDbContext context) : IRequestHandler<DispatchManifestCommand, bool>
{
    public async Task<bool> Handle(DispatchManifestCommand request, CancellationToken cancellationToken)
    {
        var manifest = await context.Manifests
            .Include(m => m.Items)
            .ThenInclude(i => i.Shipment)
            .FirstOrDefaultAsync(m => m.ManifestCode == request.ManifestCode, cancellationToken);

        if (manifest == null) return false;

        if (manifest.Status != CargoMint.Domain.Entities.Core.ManifestStatus.Pending)
        {
            return false;
        }

        manifest.Status = CargoMint.Domain.Entities.Core.ManifestStatus.Dispatched;
        
        foreach (var item in manifest.Items)
        {
            if (item.Shipment != null)
            {
                item.Shipment.Status = ShipmentScanStatus.InTransit;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
