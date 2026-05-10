namespace CargoMint.Domain.Enums;

public enum ShipmentOriginType
{
    Pickup,
    Dropoff
}

public enum ShipmentScanStatus
{
    ReceivedAtBranch,
    Processing,
    ReadyForManifest,
    Manifested,
    InTransit,
    OutForDelivery,
    Delivered,
    Cancelled,
    Rerouted,
    ReturnedByCustomer,
    RecievedAtTerminal // Keeping legacy for compatibility temporarily
}

public enum PaymentStatus
{
    Pending,
    Paid,
    Partial
}

public enum PickupOptions
{
    ServiceCentre,
    HomeDelivery
}

public enum ShipmentType
{
    Regular,
    Ecommerce,
    International
}
