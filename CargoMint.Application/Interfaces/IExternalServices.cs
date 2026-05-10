namespace CargoMint.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}

public interface ISmsService
{
    Task SendSmsAsync(string phoneNumber, string message);
}

public interface IPaymentGateway
{
    Task<PaymentResult> InitializeTransaction(decimal amount, string email, string reference);
    Task<bool> VerifyTransaction(string reference);
}

public record PaymentResult(bool Success, string AuthorizationUrl, string Message);
