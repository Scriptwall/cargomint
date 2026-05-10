using FluentValidation;
using System.Net;
using System.Text.Json;

namespace CargoMint.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var statusCode = (int)HttpStatusCode.InternalServerError;
        var result = string.Empty;

        switch (exception)
        {
            case ValidationException validationException:
                statusCode = (int)HttpStatusCode.BadRequest;
                result = JsonSerializer.Serialize(new
                {
                    status = statusCode,
                    message = "Validation Errors",
                    errors = validationException.Errors.Select(e => new { e.PropertyName, e.ErrorMessage })
                });
                break;
            case CargoMint.Domain.Exceptions.BusinessRuleException bizException:
                statusCode = (int)HttpStatusCode.UnprocessableEntity;
                result = JsonSerializer.Serialize(new
                {
                    status = statusCode,
                    message = bizException.Message
                });
                break;
            case CargoMint.Domain.Exceptions.SubscriptionSuspendedException subscriptionException:
                statusCode = (int)HttpStatusCode.PaymentRequired;
                result = JsonSerializer.Serialize(new
                {
                    status = statusCode,
                    message = subscriptionException.Message
                });
                break;
            default:
                logger.LogError(exception, "An unhandled exception occurred.");
                result = JsonSerializer.Serialize(new
                {
                    status = statusCode,
                    message = $"An unexpected error occurred: {exception.Message}",
                    detail = exception.ToString()
                });
                break;
        }

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsync(result);
    }
}
