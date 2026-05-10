using CargoMint.Application.Features.Enterprise.TenantAdmin;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using CargoMint.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CargoMint.Api.Tests;

public class TenantAdminHubServiceCentreTests
{
    [Fact]
    public async Task CreateAndUpdateServiceCentre_MaintainsExplicitHubRelationship()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedGeographyAsync(db);

        var createHub = new CreateHubHandler(db, new StubTenantProvider(11));
        var hubA = await createHub.Handle(new CreateHubCommand("Lagos Hub", "Lagos"), CancellationToken.None);
        var hubB = await createHub.Handle(new CreateHubCommand("Abuja Hub", "Abuja"), CancellationToken.None);

        var createSc = new CreateServiceCentreHandler(db, new StubTenantProvider(11));
        var scId = await createSc.Handle(new CreateServiceCentreCommand("Ikeja SC", hubA), CancellationToken.None);
        Assert.True(scId > 0);

        var updateSc = new UpdateServiceCentreHandler(db, new StubTenantProvider(11));
        var moved = await updateSc.Handle(new UpdateServiceCentreCommand(scId, "Ikeja Prime SC", hubB), CancellationToken.None);
        Assert.True(moved);

        var read = await new GetServiceCentresHandler(db, new StubTenantProvider(11))
            .Handle(new GetServiceCentresQuery(), CancellationToken.None);
        var updated = Assert.Single(read);
        Assert.Equal("Ikeja Prime SC", updated.Name);
        Assert.Equal(hubB, updated.HubId);
    }

    [Fact]
    public async Task UpdateServiceCentre_RejectsCrossTenantHubReassignment()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedGeographyAsync(db);

        var tenant11 = new StubTenantProvider(11);
        var tenant22 = new StubTenantProvider(22);

        var hub11 = await new CreateHubHandler(db, tenant11).Handle(new CreateHubCommand("T11 Hub", "Lagos"), CancellationToken.None);
        var hub22 = await new CreateHubHandler(db, tenant22).Handle(new CreateHubCommand("T22 Hub", "Abuja"), CancellationToken.None);
        var scId = await new CreateServiceCentreHandler(db, tenant11).Handle(new CreateServiceCentreCommand("T11 SC", hub11), CancellationToken.None);

        var updated = await new UpdateServiceCentreHandler(db, tenant11)
            .Handle(new UpdateServiceCentreCommand(scId, "Invalid Move", hub22), CancellationToken.None);
        Assert.False(updated);
    }

    [Fact]
    public async Task ImportHubServiceCentres_ReturnsValidationErrors_ForDuplicatesAndInvalidRows()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedGeographyAsync(db);

        var result = await new ImportHubServiceCentresHandler(db, new StubTenantProvider(11)).Handle(
            new ImportHubServiceCentresCommand(
            [
                new ImportHubServiceCentreRow("Lagos Hub", "Lagos", "Ikeja SC"),
                new ImportHubServiceCentreRow("Lagos Hub", "Lagos", "Ikeja SC"),
                new ImportHubServiceCentreRow("", "Lagos", "Missing Hub SC")
            ]),
            CancellationToken.None);

        Assert.Equal(1, result.HubsCreated);
        Assert.Equal(1, result.ServiceCentresCreated);
        Assert.Equal(2, result.RowsSkipped);
        Assert.True(result.Errors.Count >= 2);
    }

    [Fact]
    public async Task DeactivateHub_RequiresNoActiveChildServiceCentres()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedGeographyAsync(db);

        var hubId = await new CreateHubHandler(db, new StubTenantProvider(11))
            .Handle(new CreateHubCommand("Lagos Hub", "Lagos"), CancellationToken.None);
        await new CreateServiceCentreHandler(db, new StubTenantProvider(11))
            .Handle(new CreateServiceCentreCommand("Ikeja SC", hubId), CancellationToken.None);

        var deactivated = await new DeactivateHubHandler(db, new StubTenantProvider(11))
            .Handle(new DeactivateHubCommand(hubId), CancellationToken.None);
        Assert.False(deactivated);
    }

    [Fact]
    public async Task DeactivateServiceCentre_BlockedWhenAssignedToStaff()
    {
        using var db = CreateDbContext(tenantId: 11);
        await SeedGeographyAsync(db);

        var hubId = await new CreateHubHandler(db, new StubTenantProvider(11))
            .Handle(new CreateHubCommand("Lagos Hub", "Lagos"), CancellationToken.None);
        var scId = await new CreateServiceCentreHandler(db, new StubTenantProvider(11))
            .Handle(new CreateServiceCentreCommand("Ikeja SC", hubId), CancellationToken.None);

        db.Users.Add(new ApplicationUser
        {
            UserName = "ops@tenant11.local",
            Email = "ops@tenant11.local",
            FirstName = "Ops",
            LastName = "User",
            TenantId = 11,
            AssignedServiceCentreId = scId
        });
        await db.SaveChangesAsync(CancellationToken.None);

        var deactivated = await new DeactivateServiceCentreHandler(db, new StubTenantProvider(11))
            .Handle(new DeactivateServiceCentreCommand(scId), CancellationToken.None);
        Assert.False(deactivated);
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

    private static async Task SeedGeographyAsync(CargoMintDbContext db)
    {
        if (await db.Stations.AnyAsync(CancellationToken.None))
        {
            return;
        }

        var country = new Country { Name = "Nigeria", Code = "NG", DialCode = "+234" };
        db.Countries.Add(country);
        await db.SaveChangesAsync(CancellationToken.None);

        var region = new Region { Name = "West", CountryId = country.Id };
        db.Regions.Add(region);
        await db.SaveChangesAsync(CancellationToken.None);

        var state = new State { Name = "Lagos", CountryId = country.Id, RegionId = region.Id };
        db.States.Add(state);
        await db.SaveChangesAsync(CancellationToken.None);

        db.Stations.Add(new Station { Name = "Lagos Central", Code = "LAGCTR", StateId = state.Id });
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

