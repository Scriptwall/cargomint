using CargoMint.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace CargoMint.Infrastructure.External;

public class MailerSendEmailService(HttpClient httpClient, IConfiguration configuration) : IEmailService
{
    private const string DefaultBaseUrl = "https://api.mailersend.com/v1/email";
    private const string TrialSenderEmail = "test@trial.mailersend.com";

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var apiKey = configuration["ExternalServices:MailerSend:ApiKey"];
        var senderEmail = configuration["ExternalServices:MailerSend:SenderEmail"] ?? TrialSenderEmail;
        var senderName = configuration["ExternalServices:MailerSend:SenderName"] ?? "CargoMint";
        var baseUrl = configuration["ExternalServices:MailerSend:BaseUrl"] ?? DefaultBaseUrl;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("MailerSend API key is missing. Configure ExternalServices:MailerSend:ApiKey.");
        }

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var (sent, statusCode, normalizedError) = await SendWithSenderAsync(
            to,
            subject,
            body,
            baseUrl,
            senderEmail,
            senderName);

        if (!sent && !senderEmail.Equals(TrialSenderEmail, StringComparison.OrdinalIgnoreCase))
        {
            // Fallback for unverified sender domains/accounts during early setup.
            var fallback = await SendWithSenderAsync(
                to,
                subject,
                body,
                baseUrl,
                TrialSenderEmail,
                senderName);
            if (fallback.sent)
            {
                return;
            }
            statusCode = fallback.statusCode;
            normalizedError = fallback.normalizedError;
        }

        if (sent)
        {
            return;
        }

        throw new InvalidOperationException(
            $"MailerSend email send failed ({statusCode}): {normalizedError}");
    }

    private async Task<(bool sent, string statusCode, string normalizedError)> SendWithSenderAsync(
        string to,
        string subject,
        string body,
        string baseUrl,
        string senderEmail,
        string senderName)
    {
        var payload = new
        {
            from = new { email = senderEmail, name = senderName },
            to = new[]
            {
                new { email = to }
            },
            subject,
            html = body,
            text = StripHtml(body)
        };

        var response = await httpClient.PostAsJsonAsync(baseUrl, payload);
        if (response.IsSuccessStatusCode)
        {
            return (true, $"{(int)response.StatusCode} {response.StatusCode}", string.Empty);
        }

        var error = await response.Content.ReadAsStringAsync();
        return (
            false,
            $"{(int)response.StatusCode} {response.StatusCode}",
            NormalizeError(error));
    }

    private static string StripHtml(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return string.Empty;
        }

        return content
            .Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<p>", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("</p>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<strong>", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("</strong>", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Trim();
    }

    private static string NormalizeError(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "Unknown error";
        }

        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.TryGetProperty("message", out var message))
            {
                return message.GetString() ?? raw;
            }
        }
        catch
        {
            // Keep original text when response is not JSON.
        }

        return raw;
    }
}
