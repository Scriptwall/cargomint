using System.Net.Http.Json;
using Xunit;

namespace CargoMint.Api.Tests;

public class BulkLoginTests
{
    private readonly string[] _emails = new[] {
        "admin@redstar-express.com",
        "admin@dhl-nigeria.com",
        "admin@fedex-nigeria.com",
        "admin@kwik-delivery.com",
        "admin@gokada-solutions.com",
        "admin@max-logistics.com",
        "admin@ace-logistics.com",
        "admin@swiftlog-ng.com",
        "tenantadmin@swiftlog.com",
        "admin@horizon-express.com"
    };

    [Fact]
    public async Task AllTenantAdminsShouldBeAbleToLogin()
    {
        using var client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:5234");

        foreach (var email in _emails)
        {
            var request = new { Email = email, Password = "Password123!" };
            var response = await client.PostAsJsonAsync("/api/v1/Account/login", request);
            
            Assert.True(response.IsSuccessStatusCode, $"Failed to login with {email}. Status: {response.StatusCode}");
        }
    }
}
