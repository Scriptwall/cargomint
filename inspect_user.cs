using CargoMint.Domain.Entities.Core;
using CargoMint.Domain.Entities.Enterprise;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CargoMint.Infrastructure.Data;

var serviceProvider = new ServiceCollection()
    .AddDbContext<CargoMintDbContext>(options => options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=CargoMintDb;Trusted_Connection=True;MultipleActiveResultSets=true"))
    .AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<CargoMintDbContext>()
    .Services.BuildServiceProvider();

var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
var user = await userManager.FindByEmailAsync("admin@gig-logistics.com");

if (user != null)
{
    var roles = await userManager.GetRolesAsync(user);
    Console.WriteLine($"User: {user.Email}, Role: {string.Join(", ", roles)}");
}
else
{
    Console.WriteLine("User not found.");
}
