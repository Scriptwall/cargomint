using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CargoMint.Infrastructure.Data;
using CargoMint.Domain.Entities.Core;

using System.Text.Json;
using System.Collections.Generic;

namespace CargoMint.Scripts;

public class PricingMigration
{
    public static async Task Run(IServiceProvider services, int tenantId)
    {
        var context = services.GetRequiredService<CargoMintDbContext>();
        
        Console.WriteLine($"Starting Pricing Migration for Tenant {tenantId}...");

        // 1. Modifier migration from AuditLogs skipped in core (moved to enterprise or handled manually)
        Console.WriteLine("Skipping AuditLog migration in core project.");

        // 2. Clean up ZonePrices (Keep only latest or just clear for re-save)
        // Since we implemented Strict Sync, the next save in UI will clear these anyway.
        // But let's clear duplicate zones for this tenant to be safe.
        var tenantZones = await context.Zones
            .IgnoreQueryFilters()
            .Where(x => x.TenantId == tenantId)
            .ToListAsync();

        if (tenantZones.Any())
        {
            // If they have tenant-specific zones with same names as platform zones, deactivate them
            // to force usage of platform zones.
            var platformZoneNames = await context.Zones
                .IgnoreQueryFilters()
                .Where(x => x.TenantId == 0)
                .Select(x => x.Name.ToLower())
                .ToListAsync();

            foreach (var tz in tenantZones)
            {
                if (platformZoneNames.Contains(tz.Name.ToLower()))
                {
                    tz.IsActive = false;
                    Console.WriteLine($"Deactivated redundant tenant zone: {tz.Name}");
                }
            }
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Pricing Migration Complete.");
    }

    private static decimal ParsePercent(string? v, decimal def)
    {
        if (string.IsNullOrWhiteSpace(v)) return def;
        var val = v.Replace("%", "").Trim();
        return decimal.TryParse(val, out var res) ? res : def;
    }

    private static decimal ParseMoney(string? v, decimal def)
    {
        if (string.IsNullOrWhiteSpace(v)) return def;
        var val = v.Replace("NGN", "").Replace("₦", "").Replace(",", "").Trim();
        return decimal.TryParse(val, out var res) ? res : def;
    }

    private static int ParseInt(string? v, int def)
    {
        if (string.IsNullOrWhiteSpace(v)) return def;
        var val = new string(v.Where(char.IsDigit).ToArray());
        return int.TryParse(val, out var res) ? res : def;
    }
}
