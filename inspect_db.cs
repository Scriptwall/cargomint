using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CargoMint.Infrastructure.Data;

var serviceProvider = new ServiceCollection()
    .AddDbContext<CargoMintDbContext>(options => options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=CargoMintDb;Trusted_Connection=True;MultipleActiveResultSets=true"))
    .BuildServiceProvider();

using var scope = serviceProvider.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<CargoMintDbContext>();

var user = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@gig-logistics.com");

if (user != null)
{
    Console.WriteLine($"User Found: ID={user.Id}, Email={user.Email}");
    
    var roles = await context.Set<IdentityUserRole<int>>()
        .Where(ur => ur.UserId == user.Id)
        .Join(context.Set<ApplicationRole>(), ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
        .ToListAsync();
        
    Console.WriteLine($"Roles: [{string.Join("], [", roles)}]");
}
else
{
    Console.WriteLine("User not found.");
}
