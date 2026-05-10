using CargoMint.Application.Interfaces;
using System.Net.Http.Json;
using System.Text.Json;

namespace CargoMint.Infrastructure.External;

public class FlutterwaveGateway(HttpClient httpClient) : IPaymentGateway
{
    public async Task<PaymentResult> InitializeTransaction(decimal amount, string email, string reference)
    {
        var payload = new
        {
            tx_ref = reference,
            amount = amount,
            currency = "NGN",
            customer = new
            {
                email = email
            }
        };

        var response = await httpClient.PostAsJsonAsync("v3/payments", payload);

        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var url = TryResolveUrl(content, "link");
            if (!string.IsNullOrWhiteSpace(url))
            {
                return new PaymentResult(true, url, "Initialized");
            }
        }

        return new PaymentResult(false, string.Empty, "Failed to initialize Flutterwave transaction");
    }

    public async Task<bool> VerifyTransaction(string reference)
    {
        // In reality, flutterwave uses transaction ID for verification
        var response = await httpClient.GetAsync($"v3/transactions/verify_by_txref?tx_ref={reference}");
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
