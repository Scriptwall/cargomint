using CargoMint.Domain.Entities.Core;


namespace CargoMint.Application.Interfaces;

public interface ICarrierProvider
{
    string CarrierName { get; }
    Task<CarrierShipmentResult> CreateShipment(Shipment shipment);
    Task<string> GetTrackingStatus(string externalWaybill);
}

public record CarrierShipmentResult(
    bool Success, 
    string ExternalWaybill, 
    string LabelUrl, 
    string Message);
