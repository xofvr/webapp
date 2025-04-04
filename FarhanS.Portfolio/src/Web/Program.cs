using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.EntityFrameworkCore;
using FarhanS.Portfolio;
using FarhanS.Portfolio.Infrastructure.Data;
using System.Diagnostics;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Load environment-specific configurations
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.HostEnvironment.Environment}.json", optional: true, reloadOnChange: true);

// Configure HttpClient with API base URL from config
var apiBaseUrl = builder.Configuration.GetSection("ApiSettings:ApiBaseUrl").Value ?? builder.HostEnvironment.BaseAddress;
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(apiBaseUrl) });

// Log the current environment
Console.WriteLine($"Current Environment: {builder.HostEnvironment.Environment}");

// Register DbContext if connection string is available
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
}

// We're not using server-side Application Insights here
// For Blazor WebAssembly, Application Insights is configured via JavaScript
// The connection string is still in appsettings.json for reference
// but will be used in index.html or a JavaScript initializer

// Register services
// builder.Services.AddScoped<IProjectService, ProjectService>();

await builder.Build().RunAsync();