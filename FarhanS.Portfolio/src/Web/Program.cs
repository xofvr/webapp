using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.EntityFrameworkCore;
using FarhanS.Portfolio;
using FarhanS.Portfolio.Infrastructure.Data;
using System.Diagnostics;
using System.Net.Http.Headers;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Load environment-specific configurations
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.HostEnvironment.Environment}.json", optional: true, reloadOnChange: true);

// Configure HttpClient with API base URL from config and proper caching
var apiBaseUrl = builder.Configuration.GetSection("ApiSettings:ApiBaseUrl").Value ?? builder.HostEnvironment.BaseAddress;
builder.Services.AddScoped(sp => {
    var httpClient = new HttpClient { BaseAddress = new Uri(apiBaseUrl) };
    
    // Add default headers for better API performance
    httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    
    // Add user agent for analytics
    httpClient.DefaultRequestHeaders.UserAgent.Add(
        new ProductInfoHeaderValue("FarhansPortfolio", "1.0.0"));
    
    return httpClient;
});

// Log the current environment - removed in production builds
#if DEBUG
Console.WriteLine($"Current Environment: {builder.HostEnvironment.Environment}");
#endif

// Register DbContext if connection string is available
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContextFactory<ApplicationDbContext>(options => {
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
        
        // Add performance optimizations
        options.EnableSensitiveDataLogging(builder.HostEnvironment.IsDevelopment());
        options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking); // Better for read-only scenarios
    });
}

// Add memory cache for better performance
builder.Services.AddMemoryCache();

// Configure dependency injection with proper lifetime management
// Register your services here
// builder.Services.AddScoped<IProjectService, ProjectService>();

var host = builder.Build();

// Apply any pending migrations - only relevant for server-side, but keeping as a reference
// using (var scope = host.Services.CreateScope())
// {
//     var services = scope.ServiceProvider;
//     try
//     {
//         var context = services.GetRequiredService<ApplicationDbContext>();
//         context.Database.Migrate();
//     }
//     catch (Exception ex)
//     {
//         Console.WriteLine($"An error occurred while migrating the database: {ex.Message}");
//     }
// }

// Configure WebAssembly lazy loading for better startup performance
await host.RunAsync();