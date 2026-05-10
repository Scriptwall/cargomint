using CargoMint.Application.Features.Enterprise.TenantAdmin;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using CargoMint.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CargoMint.Api.Tests;

public class CaptainFleetAssignmentWorkflowTests
{
    [Fact]
    public async Task PreviewStaffImport_AcceptsDriverRoleAlias()
    {
        using var db = CreateDbContext();
        var handler = new PreviewStaffImportHandler(db, new StubTenantProvider(10));
        var result = await handler.Handle(
            new PreviewStaffImportCommand([new ImportStaffRow("Ada", "Driver", "ada.driver@tenant.local", "+234", "8011111111", "driver", "Tmp123!Pass", null, null)]),
            CancellationToken.None);

        var row = Assert.Single(result.Rows);
        Assert.True(row.IsValid);
        Assert.Equal(1, result.ValidRows);
    }

    [Fact]
    public async Task CreateFleet_WithCaptain_AssignmentPersists()
    {
        using var db = CreateDbContext();
        var captainId = await SeedCaptainAsync(db, tenantId: 10, "captain1@tenant.local", isActive: true);
        var create = new CreateTenantFleetHandler(db, new StubTenantProvider(10));

        var result = await create.Handle(new CreateTenantFleetCommand("ABC-101", "Bike", "own", null, null, 1, null, captainId.ToString(), "unit"), CancellationToken.None);
        Assert.True(result.FleetId > 0);

        var fleetRows = await new GetFleetHandler(db, new StubTenantProvider(10)).Handle(new GetFleetQuery(), CancellationToken.None);
        var fleet = Assert.Single(fleetRows);
        Assert.Equal(captainId, fleet.CaptainId);
        Assert.NotEqual("Unassigned", fleet.Captain);
    }

    [Fact]
    public async Task AssignCaptainToFleet_RejectsInactiveCaptain()
    {
        using var db = CreateDbContext();
        var inactiveCaptainId = await SeedCaptainAsync(db, tenantId: 10, "inactive@tenant.local", isActive: false);
        var fleetId = await SeedFleetAsync(db, tenantId: 10, "ABC-202");

        var ok = await new AssignCaptainToFleetHandler(db, new StubTenantProvider(10))
            .Handle(new AssignCaptainToFleetCommand(fleetId, inactiveCaptainId), CancellationToken.None);

        Assert.False(ok);
        var fleet = await db.Fleets.AsNoTracking().SingleAsync(x => x.Id == fleetId);
        Assert.Null(fleet.AssignedCaptainId);
    }

    [Fact]
    public async Task AssignCaptainToFleet_RejectsCrossTenantCaptain()
    {
        using var db = CreateDbContext();
        var foreignCaptainId = await SeedCaptainAsync(db, tenantId: 22, "foreign@tenant.local", isActive: true);
        var fleetId = await SeedFleetAsync(db, tenantId: 10, "ABC-303");

        var ok = await new AssignCaptainToFleetHandler(db, new StubTenantProvider(10))
            .Handle(new AssignCaptainToFleetCommand(fleetId, foreignCaptainId), CancellationToken.None);

        Assert.False(ok);
    }

    [Fact]
    public async Task AssignCaptainToFleet_RejectsDuplicateActiveVehicleAssignment()
    {
        using var db = CreateDbContext();
        var captainId = await SeedCaptainAsync(db, tenantId: 10, "dup@tenant.local", isActive: true);
        var fleetOneId = await SeedFleetAsync(db, tenantId: 10, "ABC-404", captainId);
        var fleetTwoId = await SeedFleetAsync(db, tenantId: 10, "ABC-405");
        Assert.True(fleetOneId > 0 && fleetTwoId > 0);

        var ok = await new AssignCaptainToFleetHandler(db, new StubTenantProvider(10))
            .Handle(new AssignCaptainToFleetCommand(fleetTwoId, captainId), CancellationToken.None);

        Assert.False(ok);
        var fleetTwo = await db.Fleets.AsNoTracking().SingleAsync(x => x.Id == fleetTwoId);
        Assert.Null(fleetTwo.AssignedCaptainId);
    }

    [Fact]
    public async Task EligibleCaptains_ReturnsOnlyActiveAssignableCaptains()
    {
        using var db = CreateDbContext();
        var eligibleId = await SeedCaptainAsync(db, tenantId: 10, "eligible@tenant.local", isActive: true);
        await SeedCaptainAsync(db, tenantId: 10, "locked@tenant.local", isActive: true, complianceLocked: true);
        await SeedCaptainAsync(db, tenantId: 10, "restricted@tenant.local", isActive: true, loginRestricted: true);

        var result = await new GetEligibleCaptainsHandler(db, new StubTenantProvider(10))
            .Handle(new GetEligibleCaptainsQuery(), CancellationToken.None);

        var row = Assert.Single(result);
        Assert.Equal(eligibleId, row.CaptainId);
    }

    private static CargoMintDbContext CreateDbContext()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<CargoMintDbContext>().UseSqlite(connection).Options;
        var db = new CargoMintDbContext(options, new StubTenantProvider(null));
        db.Database.EnsureCreated();
        return db;
    }

    private static async Task<int> SeedCaptainAsync(CargoMintDbContext db, int tenantId, string email, bool isActive, bool complianceLocked = false, bool loginRestricted = false)
    {
        var user = new ApplicationUser
        {
            TenantId = tenantId,
            UserName = email,
            Email = email,
            FirstName = "Cap",
            LastName = tenantId.ToString(),
            IsActive = isActive,
            IsLoginRestricted = loginRestricted
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(CancellationToken.None);

        var captain = new Captain
        {
            TenantId = tenantId,
            UserId = user.Id,
            CaptainCode = $"CAP-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            IsAvailable = true,
            IsComplianceLocked = complianceLocked
        };
        db.Captains.Add(captain);
        await db.SaveChangesAsync(CancellationToken.None);
        return captain.Id;
    }

    private static async Task<int> SeedFleetAsync(CargoMintDbContext db, int tenantId, string plate, int? captainId = null)
    {
        var fleet = new Fleet
        {
            TenantId = tenantId,
            RegistrationNumber = plate,
            FleetType = FleetType.Bike,
            Capacity = 1,
            IsActive = true,
            AssignedCaptainId = captainId
        };
        db.Fleets.Add(fleet);
        await db.SaveChangesAsync(CancellationToken.None);
        return fleet.Id;
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

