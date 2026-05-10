using CargoMint.Application.Interfaces;
using System.Net.Http.Json;
using System.Text.Json;

namespace CargoMint.Infrastructure.External;

public class PaystackGateway(HttpClient httpClient) : IPaymentGateway
{
    public async Task<PaymentResult> InitializeTransaction(decimal amount, string email, string reference)
    {
        var payload = new
        {
            amount = (int)(amount * 100), // Kobo
            email = email,
            reference = reference
        };

        var response = await httpClient.PostAsJsonAsync("transaction/initialize", payload);

        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var url = TryResolveUrl(content, "authorization_url");
            if (!string.IsNullOrWhiteSpace(url))
            {
                return new PaymentResult(true, url, "Initialized");
            }
        }

        return new PaymentResult(false, string.Empty, "Failed to initialize Paystack transaction");
    }

    public async Task<bool> VerifyTransaction(string reference)
    {
        var response = await httpClient.GetAsync($"transaction/verify/{reference}");
        return response.IsSuccessStatusCode;
    }

    private static string? TryResolveUrl(string json, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("data", out var data))
        {
            return null;
        }

        if (!data.TryGetProperty(fieldName, out var value))
        {
            return null;
        }

        return value.GetString();
    }
}
