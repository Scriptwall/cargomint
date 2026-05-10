using CargoMint.Application.Features.Enterprise.TenantAdmin;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using CargoMint.Domain.Enums;
using CargoMint.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CargoMint.Api.Tests;

public class TenantAdminGlobalSearchTests
{
    [Fact]
    public async Task GlobalSearch_ReturnsExpectedCategories()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedSearchDataAsync(db);

        var handler = new GetTenantGlobalSearchHandler(db, new StubTenantProvider(11));

        var staffResult = await handler.Handle(new GetTenantGlobalSearchQuery("chidi", 20), CancellationToken.None);
        Assert.Contains(staffResult.Results, x => x.Category is "captains" or "staff");

        var fleetResult = await handler.Handle(new GetTenantGlobalSearchQuery("KJA-412", 20), CancellationToken.None);
        Assert.Contains(fleetResult.Results, x => x.Category == "fleet");

        var hubResult = await handler.Handle(new GetTenantGlobalSearchQuery("Lagos VI Hub", 20), CancellationToken.None);
        Assert.Contains(hubResult.Results, x => x.Category == "hubs");

        var scResult = await handler.Handle(new GetTenantGlobalSearchQuery("Ikeja Service Centre", 20), CancellationToken.None);
        Assert.Contains(scResult.Results, x => x.Category == "service_centres");

        var merchantResult = await handler.Handle(new GetTenantGlobalSearchQuery("Jumia Food Lagos", 20), CancellationToken.None);
        Assert.Contains(merchantResult.Results, x => x.Category == "merchants");

        var shipmentResult = await handler.Handle(new GetTenantGlobalSearchQuery("WB-1001", 20), CancellationToken.None);
        Assert.Contains(shipmentResult.Results, x => x.Category == "shipments");
    }

    [Fact]
    public async Task GlobalSearch_EnforcesTenantIsolation()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedSearchDataAsync(db);

        var handler = new GetTenantGlobalSearchHandler(db, new StubTenantProvider(11));
        var result = await handler.Handle(new GetTenantGlobalSearchQuery("cross-tenant", 20), CancellationToken.None);

        Assert.Empty(result.Results);
    }

    [Fact]
    public async Task GlobalSearch_SupportsPartialMatches()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedSearchDataAsync(db);

        var handler = new GetTenantGlobalSearchHandler(db, new StubTenantProvider(11));
        var result = await handler.Handle(new GetTenantGlobalSearchQuery("Jum", 20), CancellationToken.None);

        Assert.Contains(result.Results, x => x.Category == "merchants" && x.Label.Contains("Jumia", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GlobalSearch_HandlesInvalidQueries()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedSearchDataAsync(db);

        var handler = new GetTenantGlobalSearchHandler(db, new StubTenantProvider(11));
        var symbolsOnly = await handler.Handle(new GetTenantGlobalSearchQuery("!!!", 20), CancellationToken.None);
        var tooLong = await handler.Handle(new GetTenantGlobalSearchQuery(new string('a', 101), 20), CancellationToken.None);

        Assert.Empty(symbolsOnly.Results);
        Assert.Empty(tooLong.Results);
    }

    private static CargoMintDbContext CreateDbContext(int tenantId)
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<CargoMintDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new CargoMintDbContext(options, new StubTenantProvider(tenantId));
        db.Database.EnsureCreated();
        return db;
    }

    private static async Task SeedSearchDataAsync(CargoMintDbContext db)
    {
        if (await db.Shipments.AnyAsync(CancellationToken.None))
        {
            return;
        }

        var country = new Country { Name = "Nigeria", Code = "NG", DialCode = "+234" };
        db.Countries.Add(country);
        await db.SaveChangesAsync(CancellationToken.None);

        var region = new Region { Name = "South West", CountryId = country.Id };
        db.Regions.Add(region);
        await db.SaveChangesAsync(CancellationToken.None);

        var state = new State { Name = "Lagos", CountryId = country.Id, RegionId = region.Id };
        db.States.Add(state);
        await db.SaveChangesAsync(CancellationToken.None);

        var station = new Station { Name = "Lagos Central", Code = "LAGCTR", StateId = state.Id };
        db.Stations.Add(station);
        await db.SaveChangesAsync(CancellationToken.None);

        var hub = new ServiceCentre
        {
            TenantId = 11,
            Name = "Lagos VI Hub",
            Code = "LOSVI",
            IsHub = true,
            StationId = station.Id,
            City = "Lagos"
        };
        db.ServiceCentres.Add(hub);
        await db.SaveChangesAsync(CancellationToken.None);

        var sc = new ServiceCentre
        {
            TenantId = 11,
            Name = "Ikeja Service Centre",
            Code = "IKJSC",
            IsHub = false,
            ParentHubId = hub.Id,
            StationId = station.Id,
            City = "Lagos"
        };
        db.ServiceCentres.Add(sc);

        db.ServiceCentres.Add(new ServiceCentre
        {
            TenantId = 22,
            Name = "Cross-Tenant Service Centre",
            Code = "XTRSC",
            IsHub = false,
            StationId = station.Id
        });

        var captainUser = new ApplicationUser
        {
            TenantId = 11,
            UserName = "chidi.eze@swiftlog.com",
            Email = "chidi.eze@swiftlog.com",
            FirstName = "Chidi",
            LastName = "Eze",
            IsActive = true
        };
        db.Users.Add(captainUser);
        await db.SaveChangesAsync(CancellationToken.None);

        db.Captains.Add(new Captain
        {
            TenantId = 11,
            UserId = captainUser.Id,
            CaptainCode = "CAP-11"
        });

        db.Users.Add(new ApplicationUser
        {
            TenantId = 22,
            UserName = "cross-tenant@tenant22.local",
            Email = "cross-tenant@tenant22.local",
            FirstName = "Cross",
            LastName = "Tenant",
            IsActive = true
        });

        db.Fleets.Add(new Fleet
        {
            TenantId = 11,
            RegistrationNumber = "KJA-412-AA",
            FleetType = FleetType.Van,
            Capacity = 20,
            IsActive = true
        });

        db.Fleets.Add(new Fleet
        {
            TenantId = 22,
            RegistrationNumber = "CROSS-TENANT-FLEET",
            FleetType = FleetType.Bike,
            Capacity = 5,
            IsActive = true
        });

        db.Companies.Add(new Company
        {
            TenantId = 11,
            Name = "Jumia Food Lagos",
            Email = "ops@jumia-food.com",
            PhoneNumber = "08001234567",
            CustomerCode = "MER-11"
        });

        db.Companies.Add(new Company
        {
            TenantId = 22,
            Name = "cross-tenant merchants",
            Email = "cross-tenant@merchant.local",
            PhoneNumber = "08001230000",
            CustomerCode = "MER-X"
        });

        db.Shipments.Add(new Shipment
        {
            TenantId = 11,
            Waybill = "WB-1001",
            CustomerCode = "MER-11",
            CustomerType = CustomerType.Company,
            ReceiverName = "Amina Yusuf",
            ReceiverPhoneNumber = "08000000001",
            DepartureServiceCentreId = sc.Id,
            DestinationServiceCentreId = sc.Id,
            Status = ShipmentScanStatus.ReceivedAtBranch,
            PaymentStatus = PaymentStatus.Pending
        });

        db.Shipments.Add(new Shipment
        {
            TenantId = 22,
            Waybill = "cross-tenant-waybill",
            CustomerCode = "MER-X",
            CustomerType = CustomerType.Company,
            ReceiverName = "Cross Tenant",
            ReceiverPhoneNumber = "08000000002",
            DepartureServiceCentreId = sc.Id,
            DestinationServiceCentreId = sc.Id,
            Status = ShipmentScanStatus.ReceivedAtBranch,
            PaymentStatus = PaymentStatus.Pending
        });

        await db.SaveChangesAsync(CancellationToken.None);
    }

    private sealed class StubTenantProvider(int? tenantId) : ITenantProvider
    {
        public int? TenantId => tenantId;
        public string? UserId => null;
        public int? GetServiceCentreId() => null;
        public bool HasAnyRole(params string[] roles) => false;
        public string? GetUserName() => null;
        public string? GetUserEmail() => null;
    }
}

