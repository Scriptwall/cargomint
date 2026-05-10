using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using Microsoft.Extensions.Logging;

namespace CargoMint.Infrastructure.External.Carriers;

public class FedExCarrierProvider(ILogger<FedExCarrierProvider> logger) : ICarrierProvider
{
    public string CarrierName => "FedEx";

    public async Task<CarrierShipmentResult> CreateShipment(Shipment shipment)
    {
        logger.LogInformation("Creating FedEx shipment for waybill: {Waybill}", shipment.Waybill);

        try
        {
            // Mocked return
            await Task.Delay(100); // Simulate network
            return new CarrierShipmentResult(true, $"FDX-{shipment.Waybill}", "https://fedex.com/label.pdf", "Success");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create FedEx shipment");
            return new CarrierShipmentResult(false, string.Empty, string.Empty, ex.Message);
        }
    }

    public async Task<string> GetTrackingStatus(string externalWaybill)
    {
        logger.LogInformation("Tracking FedEx shipment: {ExternalWaybill}", externalWaybill);
        
        return await Task.FromResult("InTransit");
    }
}
