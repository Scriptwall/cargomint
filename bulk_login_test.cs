using System.Net.Http.Json;

var emails = new[] {
    "admin@redstar-express.com",
    "admin@dhl-nigeria.com",
    "admin@fedex-nigeria.com",
    "admin@kwik-delivery.com",
    "admin@gokada-solutions.com",
    "admin@max-logistics.com",
    "admin@ace-logistics.com",
    "admin@swiftlog-ng.com",
    "tenantadmin@swiftlog.com",
    "admin@horizon-express.com"
};

using var client = new HttpClient();
client.BaseAddress = new Uri("http://localhost:5234");

Console.WriteLine("Bulk Login Test Results:");
Console.WriteLine("--------------------------------------------------");

foreach (var email in emails)
{
    var request = new { Email = email, Password = "Password123!" };
    var response = await client.PostAsJsonAsync("/api/v1/Account/login", request);
    
    if (response.IsSuccessStatusCode)
    {
        var data = await response.Content.ReadFromJsonAsync<dynamic>();
        Console.WriteLine($"[PASS] {email}");
    }
    else
    {
        var error = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"[FAIL] {email} - Status: {response.StatusCode}, Error: {error}");
    }
}
