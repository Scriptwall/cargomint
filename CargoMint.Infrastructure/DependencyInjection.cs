using CargoMint.Application.Interfaces;
using CargoMint.Infrastructure.Configuration;
using CargoMint.Infrastructure.External;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Hangfire;
using Hangfire.MemoryStorage;
using System.Net.Http.Headers;

namespace CargoMint.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var externalServices = configuration
            .GetSection(ExternalServicesSettings.SectionName)
            .Get<ExternalServicesSettings>() ?? new ExternalServicesSettings();

        // External Services
        // Payment Gateways
        services.AddHttpClient<IPaymentGateway, PaystackGateway>(client =>
        {
            ConfigureGatewayClient(client, externalServices.Paystack, "https://api.paystack.co/");
        });

        services.AddHttpClient<FlutterwaveGateway>(client =>
        {
            ConfigureGatewayClient(client, externalServices.Flutterwave, "https://api.flutterwave.com/");
        });

        services.AddScoped<IFleetProvider, InternalFleetProvider>();
        services.AddHttpClient<IEmailService, MailerSendEmailService>();
        services.AddScoped<ISmsService, MockMessagingService>();

        // Carrier Integrations
        services.AddSingleton<ICarrierFactory, CargoMint.Infrastructure.External.Carriers.CarrierFactory>();
        services.AddHttpClient<CargoMint.Infrastructure.External.Carriers.DhlCarrierProvider>(client => {
            client.BaseAddress = new Uri("https://api.dhl.com/");
        });
        services.AddHttpClient<CargoMint.Infrastructure.External.Carriers.FedExCarrierProvider>(client => {
            client.BaseAddress = new Uri("https://apis.fedex.com/");
        });

        // Hangfire
        services.AddHangfire(configuration => configuration
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseMemoryStorage());

        services.AddHangfireServer();

        return services;
    }

    private static void ConfigureGatewayClient(HttpClient client, GatewayClientSettings settings, string defaultBaseUrl)
    {
        var baseUrl = string.IsNullOrWhiteSpace(settings.BaseUrl) ? defaultBaseUrl : settings.BaseUrl;
        client.BaseAddress = new Uri(baseUrl);

        if (!string.IsNullOrWhiteSpace(settings.SecretKey))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", settings.SecretKey);
        }
    }
}
