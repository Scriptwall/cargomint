namespace CargoMint.Api.Middleware;

/// <summary>
/// Injects a correlation ID into every request/response cycle and adds it to
/// the structured log scope so all log lines in a request carry the same ID.
/// The client may provide its own ID via the <c>X-Correlation-Id</c> header;
/// otherwise a new GUID is generated.
/// </summary>
public class CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var incoming) && !string.IsNullOrWhiteSpace(incoming)
            ? incoming.ToString()
            : Guid.NewGuid().ToString("N");

        context.Items[HeaderName] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["RequestPath"]   = context.Request.Path,
            ["RequestMethod"] = context.Request.Method,
        }))
        {
            await next(context);
        }
    }
}
