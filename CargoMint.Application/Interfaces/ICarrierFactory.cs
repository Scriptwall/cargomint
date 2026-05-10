namespace CargoMint.Application.Interfaces;

public interface ICarrierFactory
{
    ICarrierProvider GetProvider(string carrierName);
}
