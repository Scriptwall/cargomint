namespace CargoMint.Infrastructure.Configuration;

public sealed class ExternalServicesSettings
{
    public const string SectionName = "ExternalServices";
    public GatewayClientSettings Paystack { get; init; } = new();
    public GatewayClientSettings Flutterwave { get; init; } = new();
}

public sealed class GatewayClientSettings
{
    public string BaseUrl { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
}
