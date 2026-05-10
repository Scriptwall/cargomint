using CargoMint.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Net.Http.Headers;

namespace CargoMint.Infrastructure.External;

public class SendGridEmailService(HttpClient httpClient, IConfiguration configuration) : IEmailService
{
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var apiKey = configuration["ExternalServices:SendGrid:ApiKey"];
        var senderEmail = configuration["ExternalServices:SendGrid:SenderEmail"] ?? "notifications@cargomint.io";
        var senderName = configuration["ExternalServices:SendGrid:SenderName"] ?? "CargoMint";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            // Fallback to console if no API key (dev environment)
            Console.WriteLine($"[SENDGRID MOCK] To: {to}, Subject: {subject}");
            return;
        }

        var payload = new
        {
            personalizations = new[]
            {
                new
                {
                    to = new[] { new { email = to } },
                    subject = subject
                }
            },
            from = new { email = senderEmail, name = senderName },
            content = new[]
            {
                new { type = "text/html", value = body }
            }
        };

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var response = await httpClient.PostAsJsonAsync("https://api.sendgrid.com/v3/mail/send", payload);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to send email via SendGrid: {error}");
        }
    }
}
