using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CargoMint.Api.Tests;

public class AuthorizationPolicyTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthorizationPolicyTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(_ => { });
    }

    [Fact]
    public async Task AdminDashboard_WithoutToken_ReturnsUnauthorized()
    {
        using var client = CreateClient();
        var response = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminDashboard_WithCustomerRole_ReturnsForbidden()
    {
        using var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            JwtTestTokenFactory.CreateToken("Customer"));

        var response = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminDashboard_WithAdminRole_PassesAuthorizationGate()
    {
        using var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            JwtTestTokenFactory.CreateToken("Admin"));

        var response = await client.GetAsync("/api/v1/admin/dashboard");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PublicQuote_Anonymous_DoesNotRequireAuth()
    {
        using var client = CreateClient();
        var response = await client.GetAsync(
            "/api/v1/pricing/public-quote?DepartureStationId=1&DestinationStationId=2&Weight=1");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PublicTrackingTimeline_Anonymous_DoesNotRequireAuth()
    {
        using var client = CreateClient();
        var response = await client.GetAsync("/api/v1/tracking/public/WB-NOT-FOUND");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeliveryProof_WithoutToken_ReturnsUnauthorized()
    {
        using var client = CreateClient();
        var payload = new StringContent(
            "{\"waybill\":\"WB1\",\"otpCode\":\"123456\",\"recipientName\":\"John\",\"signatureData\":\"sig\"}",
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/v1/compliance/delivery/proof", payload);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MerchantBulkPreview_WithoutToken_ReturnsUnauthorized()
    {
        using var client = CreateClient();
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent("ReceiverName,ReceiverPhone,ReceiverAddress,DestinationServiceCentreId,DeclaredValue,Description,Quantity,Weight,IsCod"u8.ToArray()), "file", "bulk.csv");

        var response = await client.PostAsync("/api/v1/customers/merchant/bulk/preview", form);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TenantAdminStaff_WithServiceCentreAdminRole_ReturnsForbidden()
    {
        using var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            JwtTestTokenFactory.CreateToken("ServiceCentreAdmin", tenantId: 8));

        var response = await client.GetAsync("/api/v1/TenantAdmin/staff");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task TenantAdminStaff_WithTenantAdminRole_PassesAuthorizationGate()
    {
        using var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            JwtTestTokenFactory.CreateToken("TenantAdmin", tenantId: 8));

        var response = await client.GetAsync("/api/v1/TenantAdmin/staff");
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task LogisticsDashboard_WithServiceCentreAdminRole_PassesAuthorizationGate()
    {
        using var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            JwtTestTokenFactory.CreateToken("ServiceCentreAdmin", tenantId: 8));

        var response = await client.GetAsync("/api/v1/Logistics/dashboard");
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }
}
