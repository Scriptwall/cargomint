using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CargoMint.Infrastructure.Data;

namespace CargoMint.Scripts;

public class PricingDiagnostic
{
    public static async Task Run(IServiceProvider services)
    {
        var context = services.GetRequiredService<CargoMintDbContext>();
        
        var zones = await context.Zones
            .IgnoreQueryFilters()
            .Select(z => new { z.Id, z.TenantId, z.Name, z.IsActive })
            .ToListAsync();
            
        Console.WriteLine("--- Zone Diagnostics ---");
        foreach (var group in zones.GroupBy(z => z.TenantId))
        {
            Console.WriteLine($"Tenant ID: {group.Key}");
            foreach (var z in group)
            {
                Console.WriteLine($"  ID: {z.Id}, Name: '{z.Name}', Active: {z.IsActive}");
            }
        }
        
        var zonePrices = await context.ZonePrices
            .IgnoreQueryFilters()
            .Select(p => new { p.Id, p.TenantId, p.ZoneId, p.Weight, p.Price })
            .ToListAsync();
            
        Console.WriteLine("\n--- Zone Price Diagnostics ---");
        foreach (var group in zonePrices.GroupBy(p => p.TenantId))
        {
            Console.WriteLine($"Tenant ID: {group.Key}, Count: {group.Count()}");
        }
        
        Console.WriteLine("\n--- Modifier Audit Log Diagnostics (Enterprise Only) ---");
    }
}
