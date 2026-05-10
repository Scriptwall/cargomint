namespace CargoMint.Api.Configuration;

public sealed class HangfireSettings
{
    public const string SectionName = "Hangfire";
    public string DashboardPath { get; init; } = "/hangfire";
}
