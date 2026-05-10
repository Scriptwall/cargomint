using CargoMint.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace CargoMint.Infrastructure.External.Carriers;

public class CarrierFactory(IServiceProvider serviceProvider) : ICarrierFactory
{
    public ICarrierProvider GetProvider(string carrierName)
    {
        // Using IServiceProvider to dynamically resolve the required typed client
        // to avoid injecting all clients into classes that only need one.
        
        return carrierName.ToUpperInvariant() switch
        {
            "DHL" => serviceProvider.GetRequiredService<DhlCarrierProvider>(),
            "FEDEX" => serviceProvider.GetRequiredService<FedExCarrierProvider>(),
            _ => throw new NotSupportedException($"Carrier {carrierName} is not supported.")
        };
    }
}
