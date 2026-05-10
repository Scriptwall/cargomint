using CargoMint.Application.Interfaces;
using CargoMint.Infrastructure.External;
using Microsoft.Extensions.DependencyInjection;

namespace CargoMint.Infrastructure.External;

public class MockMessagingService : IEmailService, ISmsService
{
    public Task SendEmailAsync(string to, string subject, string body)
    {
        Console.WriteLine($"[EMAIL] To: {to}, Subject: {subject}");
        return Task.CompletedTask;
    }

    public Task SendSmsAsync(string phoneNumber, string message)
    {
        Console.WriteLine($"[SMS] To: {phoneNumber}, Message: {message}");
        return Task.CompletedTask;
    }
}
