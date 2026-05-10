using CargoMint.Application.Features.Enterprise.TenantAdmin;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using CargoMint.Domain.Enums;
using CargoMint.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CargoMint.Api.Tests;

public class TenantDashboardIntegrityTests
{
    [Fact]
    public async Task Dashboard_HappyPath_IsTenantScoped_AndComputesMetrics()
    {
        var tenantProvider = new TestTenantProvider(8);
        await using var db = BuildContext(tenantProvider);
        await SeedCoreAsync(db);

        db.Users.Add(new ApplicationUser { TenantId = 8, FirstName = "T", LastName = "Admin", Email = "a@t8.com", UserName = "a@t8.com", IsActive = true });
        db.Users.Add(new ApplicationUser { TenantId = 8, FirstName = "T", LastName = "Susp", Email = "b@t8.com", UserName = "b@t8.com", IsActive = false, IsLoginRestricted = true });
        db.Users.Add(new ApplicationUser { TenantId = 9, FirstName = "O", LastName = "User", Email = "c@t9.com", UserName = "c@t9.com", IsActive = true });

        db.ServiceCentres.Add(new ServiceCentre { TenantId = 8, Name = "Hub 8", Code = "H8", StationId = 1, IsHub = true });
        db.ServiceCentres.Add(new ServiceCentre { TenantId = 8, Name = "SC 8", Code = "SC8", StationId = 1, IsHub = false });
        db.ServiceCentres.Add(new ServiceCentre { TenantId = 9, Name = "SC 9", Code = "SC9", StationId = 1, IsHub = false });

        db.Shipments.Add(new Shipment { TenantId = 8, Waybill = "WB-8-1", CustomerCode = "C8", ReceiverName = "R", ReceiverPhoneNumber = "1", DepartureServiceCentreId = 2, DestinationServiceCentreId = 2, Status = ShipmentScanStatus.Delivered, PaymentStatus = PaymentStatus.Paid, GrandTotal = 1500m, IsCashOnDelivery = true, CashOnDeliveryAmount = 600m, CreatedAt = DateTime.UtcNow.AddHours(-2) });
        db.Shipments.Add(new Shipment { TenantId = 8, Waybill = "WB-8-2", CustomerCode = "C8", ReceiverName = "R", ReceiverPhoneNumber = "1", DepartureServiceCentreId = 2, DestinationServiceCentreId = 2, Status = ShipmentScanStatus.InTransit, PaymentStatus = PaymentStatus.Pending, GrandTotal = 2500m, IsCashOnDelivery = true, CashOnDeliveryAmount = 900m, CreatedAt = DateTime.UtcNow.AddHours(-1) });
        db.Shipments.Add(new Shipment { TenantId = 9, Waybill = "WB-9-1", CustomerCode = "C9", ReceiverName = "R", ReceiverPhoneNumber = "1", DepartureServiceCentreId = 3, DestinationServiceCentreId = 3, Status = ShipmentScanStatus.Delivered, PaymentStatus = PaymentStatus.Paid, GrandTotal = 9999m, CreatedAt = DateTime.UtcNow.AddHours(-1) });
        await db.SaveChangesAsync();

        var handler = new GetTenantDashboardHandler(db, tenantProvider);
        var response = await handler.Handle(new GetTenantDashboardQuery("today"), CancellationToken.None);

        Assert.Equal(2, response.TotalShipments);
        Assert.Equal(2, response.StaffCount);
        Assert.Equal(1, response.SuspendedStaffCount);
        Assert.Equal(1, response.HubsCount);
        Assert.Equal(1, response.ServiceCentreCount);
        Assert.Equal(4000m, response.Revenue);
        Assert.Equal(1, response.DeliveredShipments);
        Assert.Equal(1, response.InTransitShipments);
        Assert.Equal(900m, response.CodPendingAmount);
        Assert.Equal(600m, response.CodCollectedAmount);
        Assert.True(response.Trace.Count > 0);
    }

    [Fact]
    public async Task Dashboard_EmptyDataset_ReturnsZeroes()
    {
        var tenantProvider = new TestTenantProvider(8);
        await using var db = BuildContext(tenantProvider);
        await SeedCoreAsync(db);

        var handler = new GetTenantDashboardHandler(db, tenantProvider);
        var response = await handler.Handle(new GetTenantDashboardQuery("week"), CancellationToken.None);

        Assert.Equal(0, response.TotalShipments);
        Assert.Equal(0, response.StaffCount);
        Assert.Equal(0m, response.Revenue);
        Assert.Empty(response.StatusBreakdown);
    }

    [Fact]
    public async Task Dashboard_InvalidTenantContext_ReturnsEmptyResponse()
    {
        var tenantProvider = new TestTenantProvider(null);
        await using var db = BuildContext(tenantProvider);
        await SeedCoreAsync(db);

        db.Shipments.Add(new Shipment { TenantId = 8, Waybill = "WB-8", CustomerCode = "C8", ReceiverName = "R", ReceiverPhoneNumber = "1", DepartureServiceCentreId = 1, DestinationServiceCentreId = 1, Status = ShipmentScanStatus.Delivered, PaymentStatus = PaymentStatus.Paid, GrandTotal = 1200m, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var handler = new GetTenantDashboardHandler(db, tenantProvider);
        var response = await handler.Handle(new GetTenantDashboardQuery("month"), CancellationToken.None);

        Assert.Equal(0, response.TotalShipments);
        Assert.Equal(0, response.StaffCount);
        Assert.Equal(0m, response.Revenue);
    }

    [Fact]
    public async Task Dashboard_CustomRange_FiltersByPeriod()
    {
        var tenantProvider = new TestTenantProvider(8);
        await using var db = BuildContext(tenantProvider);
        await SeedCoreAsync(db);

        var oldDate = DateTime.UtcNow.AddDays(-20);
        var inRangeDate = DateTime.UtcNow.AddDays(-1);
        db.Shipments.Add(new Shipment { TenantId = 8, Waybill = "WB-OLD", CustomerCode = "C8", ReceiverName = "R", ReceiverPhoneNumber = "1", DepartureServiceCentreId = 1, DestinationServiceCentreId = 1, Status = ShipmentScanStatus.Delivered, PaymentStatus = PaymentStatus.Paid, GrandTotal = 100m, CreatedAt = oldDate });
        db.Shipments.Add(new Shipment { TenantId = 8, Waybill = "WB-IN", CustomerCode = "C8", ReceiverName = "R", ReceiverPhoneNumber = "1", DepartureServiceCentreId = 1, DestinationServiceCentreId = 1, Status = ShipmentScanStatus.Delivered, PaymentStatus = PaymentStatus.Paid, GrandTotal = 200m, CreatedAt = inRangeDate });
        await db.SaveChangesAsync();

        var fromUtc = DateTime.UtcNow.AddDays(-2).Date;
        var toUtc = DateTime.UtcNow.Date;
        var handler = new GetTenantDashboardHandler(db, tenantProvider);
        var response = await handler.Handle(new GetTenantDashboardQuery("custom", fromUtc, toUtc), CancellationToken.None);

        Assert.Equal(1, response.TotalShipments);
        Assert.Equal(200m, response.Revenue);
    }

    private static async Task SeedCoreAsync(CargoMintDbContext db)
    {
        if (await db.Stations.AnyAsync()) return;

        var country = new Country { Name = "Nigeria", Code = "NG", CurrencyCode = "NGN", CurrencySymbol = "₦" };
        db.Countries.Add(country);
        await db.SaveChangesAsync();

        var state = new State { Name = "Lagos", CountryId = country.Id };
        db.States.Add(state);
        await db.SaveChangesAsync();

        db.Stations.Add(new Station { Name = "Ikeja", StateId = state.Id });
        await db.SaveChangesAsync();
    }

    private static CargoMintDbContext BuildContext(ITenantProvider tenantProvider)
    {
        var options = new DbContextOptionsBuilder<CargoMintDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new CargoMintDbContext(options, tenantProvider);
    }

    private sealed class TestTenantProvider(int? tenantId) : ITenantProvider
    {
        public int? TenantId { get; } = tenantId;
        public string? UserId => null;
        public int? GetServiceCentreId() => null;
        public bool HasAnyRole(params string[] roles) => false;
        public string? GetUserName() => null;
        public string? GetUserEmail() => null;
    }
}

