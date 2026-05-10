namespace CargoMint.Application.Interfaces;

public interface IFleetProvider
{
    Task<TripResult> DispatchTrip(int fleetId, int captainId, List<int> manifestIds);
    Task<TripStatus> GetTripStatus(string tripReference);
}

public record TripResult(bool Success, string TripReference, string Message);

public enum TripStatus
{
    InTransit,
    Delayed,
    Arrived,
    Cancelled
}
