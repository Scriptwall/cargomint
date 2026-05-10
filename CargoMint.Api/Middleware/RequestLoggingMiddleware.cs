using System.Diagnostics;
using CargoMint.Application.Interfaces;

namespace CargoMint.Api.Middleware;

/// <summary>
/// Emits structured request completion logs with timing and tenant context.
/// </summary>
public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
    {
        var sw = Stopwatch.StartNew();
        await next(context);
        sw.Stop();

        logger.LogInformation(
            "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms (TenantId: {TenantId})",
            context.Request.Method,
            context.Request.Path.Value,
            context.Response.StatusCode,
            sw.ElapsedMilliseconds,
            tenantProvider.TenantId);
    }
}
