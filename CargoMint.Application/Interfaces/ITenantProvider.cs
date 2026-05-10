namespace CargoMint.Application.Interfaces;

public interface ITenantProvider
{
    int? TenantId { get; }
    string? UserId { get; }
    int? GetServiceCentreId();
    bool HasAnyRole(params string[] roles);
    string? GetUserName();
    string? GetUserEmail();
}
