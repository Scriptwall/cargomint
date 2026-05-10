namespace CargoMint.Domain.Common;

public interface IMustHaveTenant
{
    int TenantId { get; set; }
}
