namespace CargoMint.Api.Security;

public static class RoleNames
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Admin = "Admin";
    public const string Operator = "Operator";
    public const string TenantAdmin = "TenantAdmin";
    public const string HubManager = "HubManager";
    /// <summary>
    /// Manages everything within their assigned service centre.
    /// Cannot see or touch other service centres.
    /// </summary>
    public const string ServiceCentreAdmin = "ServiceCentreAdmin";
    public const string DeskOperator = "DeskOperator";
    public const string FinanceUser = "FinanceUser";
    public const string Captain = "Captain";
    public const string Partner = "Partner";
    public const string Customer = "Customer";
}
