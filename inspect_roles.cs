using CargoMint.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;

var services = new ServiceCollection();
services.AddDbContext<CargoMintDbContext>(options =>
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=CargoMintDb;Trusted_Connection=True;MultipleActiveResultSets=true"));
services.AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<CargoMintDbContext>();

var serviceProvider = services.BuildServiceProvider();
using var scope = serviceProvider.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<CargoMintDbContext>();

var roles = await context.Roles.ToListAsync();
Console.WriteLine("Roles in DB:");
foreach (var r in roles)
{
    Console.WriteLine($" - ID: {r.Id}, Name: {r.Name}, Normalized: {r.NormalizedName}");
}

var userRoles = await context.UserRoles.ToListAsync();
Console.WriteLine($"\nTotal User-Role mappings: {userRoles.Count}");

var users = await context.Users.IgnoreQueryFilters().Take(10).ToListAsync();
Console.WriteLine("\nSample Users:");
foreach (var u in users)
{
    Console.WriteLine($" - ID: {u.Id}, Email: {u.Email}, TenantId: {u.TenantId}");
}
