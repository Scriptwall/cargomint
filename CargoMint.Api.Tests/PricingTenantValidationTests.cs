using CargoMint.Application.Features.Core.Pricing;
using CargoMint.Application.Features.Enterprise.TenantAdmin;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using CargoMint.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CargoMint.Api.Tests;

public class PricingTenantValidationTests
{
    [Fact]
    public async Task ZoneCrud_Works_PerTenant()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var db = CreateDb(11);
        var update = new UpdateTenantZoneHandler(db, new TestTenantProvider(11));
        var delete = new DeleteTenantZoneHandler(db, new TestTenantProvider(11));
        await db.Zones.AddAsync(new Zone { Name = "Zone Alpha", IsActive = true, TenantId = 11 });
        await db.SaveChangesAsync();
        var zoneId = await db.Zones.Select(z => z.Id).FirstAsync();
        Assert.True(await update.Handle(new UpdateTenantZoneCommand(zoneId, "Zone Alpha Prime"), default));
        Assert.True(await delete.Handle(new DeleteTenantZoneCommand(zoneId), default));
    }

    [Fact]
    public async Task MatrixCrud_And_Reload_Works()
    {
        await using var db = CreateDb(11);
        await db.Zones.AddRangeAsync(
            new Zone { Name = "Zone 1", IsActive = true, TenantId = 11 },
            new Zone { Name = "Zone 2", IsActive = true, TenantId = 11 });
        await db.SaveChangesAsync();
        var zones = await db.Zones.OrderBy(z => z.Name).ToListAsync();
        Assert.Equal(2, zones.Count);

        var upsert = new UpsertZoneMatrixCellHandler(db, new TestTenantProvider(11));
        var get = new GetTenantPricingHandler(db, new TestTenantProvider(11));

        Assert.True(await upsert.Handle(new UpsertZoneMatrixCellCommand(zones[0].Id, zones[1].Id, 1250m), default));
        var payload = await get.Handle(new GetTenantPricingQuery(), default);

        Assert.Equal(2, payload.Zones.Count);
        Assert.Contains(payload.Matrix, x => x.Origin == "Zone 1");
    }

    [Fact]
    public async Task MissingMatrixPath_ReturnsNullQuote()
    {
        await using var db = CreateDb(11);
        var country = new Country { Name = "Nigeria", Code = "NGA", CurrencyCode = "NGN", CurrencySymbol = "₦" };
        var state = new State { Name = "Lagos", Country = country };
        var dep = new Station { Name = "Dep", State = state };
        var dest = new Station { Name = "Dest", State = state };
        await db.Countries.AddAsync(country);
        await db.States.AddAsync(state);
        await db.Stations.AddRangeAsync(dep, dest);
        await db.SaveChangesAsync();

        var quote = await new GetPriceQuoteHandler(db, new TestTenantProvider(11))
            .Handle(new GetPriceQuoteQuery(dep.Id, dest.Id, 1m), default);
        Assert.Null(quote);
    }

    [Fact]
    public async Task InvalidZoneReferences_FailMatrixUpsert()
    {
        await using var db = CreateDb(11);
        await db.Zones.AddAsync(new Zone { Name = "Only Zone", IsActive = true });
        await db.SaveChangesAsync();

        var ok = await new UpsertZoneMatrixCellHandler(db, new TestTenantProvider(11))
            .Handle(new UpsertZoneMatrixCellCommand(999, 1000, 2000m), default);
        Assert.False(ok);
    }

    [Fact]
    public async Task TenantBoundaries_AreEnforced()
    {
        await using var db = CreateDb(11);
        var id = await new CreateTenantZoneHandler(db, new TestTenantProvider(11)).Handle(new CreateTenantZoneCommand("Tenant1 Zone"), default);
        Assert.True(id > 0);

        var updateOk = await new UpdateTenantZoneHandler(db, new TestTenantProvider(12)).Handle(new UpdateTenantZoneCommand(id, "X"), default);
        Assert.False(updateOk);
    }

    private static CargoMintDbContext CreateDb(int tenantId)
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<CargoMintDbContext>()
            .UseSqlite(connection)
            .Options;
        var db = new CargoMintDbContext(options, new TestTenantProvider(tenantId));
        db.Database.EnsureCreated();
        return db;
    }

    private sealed class TestTenantProvider : ITenantProvider
    {
        public TestTenantProvider(int? tenantId)
        {
            TenantId = tenantId;
        }

        public int? TenantId { get; }
        public string? UserId => null;
        public int? GetServiceCentreId() => null;
        public bool HasAnyRole(params string[] roles) => false;
        public string? GetUserName() => null;
        public string? GetUserEmail() => null;
    }
}

