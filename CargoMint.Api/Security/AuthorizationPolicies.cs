using Microsoft.AspNetCore.Authorization;

namespace CargoMint.Api.Security;

public static class AuthorizationPolicies
{
    public const string AdminConsole = "AdminConsole";
    public const string LogisticsOps = "LogisticsOps";
    public const string FinanceOps = "FinanceOps";
    public const string CaptainOps = "CaptainOps";
    public const string MerchantPortal = "MerchantPortal";
    public const string TenantAdminPortal = "TenantAdminPortal";

    public static IServiceCollection AddCargoMintAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(AdminConsole, policy =>
                policy.RequireRole(RoleNames.SuperAdmin, RoleNames.Admin));

            options.AddPolicy(LogisticsOps, policy =>
                policy.RequireRole(
                    RoleNames.SuperAdmin,
                    RoleNames.Admin,
                    RoleNames.Operator,
                    RoleNames.TenantAdmin,
                    RoleNames.HubManager,
                    RoleNames.ServiceCentreAdmin,
                    RoleNames.DeskOperator));

            options.AddPolicy(FinanceOps, policy =>
                policy.RequireRole(
                    RoleNames.SuperAdmin,
                    RoleNames.Admin,
                    RoleNames.Operator,
                    RoleNames.TenantAdmin,
                    RoleNames.FinanceUser));

            options.AddPolicy(CaptainOps, policy =>
                policy.RequireRole(
                    RoleNames.SuperAdmin,
                    RoleNames.Admin,
                    RoleNames.Operator,
                    RoleNames.Captain));

            options.AddPolicy(MerchantPortal, policy =>
                policy.RequireRole(
                    RoleNames.SuperAdmin,
                    RoleNames.Admin,
                    RoleNames.Operator,
                    RoleNames.Partner,
                    RoleNames.Customer));

            // Logistics company owner/admin — full tenant-wide access.
            // ServiceCentreAdmin uses LogisticsOps but is filtered at handler level by claim.
            options.AddPolicy(TenantAdminPortal, policy =>
                policy.RequireRole(
                    RoleNames.TenantAdmin,
                    RoleNames.SuperAdmin,
                    RoleNames.Admin));
        });

        return services;
    }
}
