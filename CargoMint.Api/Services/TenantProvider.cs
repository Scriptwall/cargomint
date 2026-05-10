using CargoMint.Application.Interfaces;

namespace CargoMint.Api.Services;

public class TenantProvider(IHttpContextAccessor httpContextAccessor) : ITenantProvider
{
    private const string TenantIdHeader = "X-Tenant-Id";
    private static readonly string[] TenantClaimKeys = ["tenantId", "tenant_id"];

    public int? TenantId
    {
        get
        {
            var context = httpContextAccessor.HttpContext;
            if (context == null)
            {
                return null;
            }

            if (TryGetTenantIdFromClaim(context, out var claimTenantId))
            {
                return claimTenantId;
            }

            if (TryGetTenantIdFromHeader(context, out var headerTenantId))
            {
                return headerTenantId;
            }

            return TryGetTenantIdFromQuery(context, out var queryTenantId) ? queryTenantId : null;
        }
    }

    public string? UserId
    {
        get
        {
            var context = httpContextAccessor.HttpContext;
            return context?.User?.FindFirst("userId")?.Value
                ?? context?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        }
    }

    private static bool TryGetTenantIdFromClaim(HttpContext context, out int tenantId)
    {
        tenantId = 0;

        foreach (var claimKey in TenantClaimKeys)
        {
            var claimValue = context.User.FindFirst(claimKey)?.Value;
            if (int.TryParse(claimValue, out tenantId) && tenantId > 0)
            {
                return true;
            }
        }

        return false;
    }

    private static bool TryGetTenantIdFromHeader(HttpContext context, out int tenantId)
    {
        tenantId = 0;
        var headerValue = context.Request.Headers[TenantIdHeader].FirstOrDefault();
        return int.TryParse(headerValue, out tenantId) && tenantId > 0;
    }

    private static bool TryGetTenantIdFromQuery(HttpContext context, out int tenantId)
    {
        tenantId = 0;
        var queryValue = context.Request.Query["tenantId"].FirstOrDefault();
        return int.TryParse(queryValue, out tenantId) && tenantId > 0;
    }

    public int? GetServiceCentreId()
    {
        var context = httpContextAccessor.HttpContext;
        if (context == null) return null;

        var claimValue = context.User.FindFirst("assignedServiceCentreId")?.Value;
        if (int.TryParse(claimValue, out var scId))
        {
            return scId;
        }

        return null;
    }

    public bool HasAnyRole(params string[] roles)
    {
        var context = httpContextAccessor.HttpContext;
        if (context?.User?.Identity?.IsAuthenticated != true || roles.Length == 0)
        {
            return false;
        }

        foreach (var role in roles)
        {
            if (context.User.IsInRole(role))
            {
                return true;
            }
        }

        return false;
    }

    public string? GetUserName()
    {
        var context = httpContextAccessor.HttpContext;
        return context?.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? context?.User?.FindFirst("userName")?.Value;
    }

    public string? GetUserEmail()
    {
        var context = httpContextAccessor.HttpContext;
        return context?.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? context?.User?.FindFirst("email")?.Value;
    }
}
