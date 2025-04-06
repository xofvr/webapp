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

// Configure detailed logging for better error diagnosis
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// In development/staging, add more detailed logging
if (!builder.HostEnvironment.IsProduction())
{
    builder.Logging.AddBrowserConsole(options =>
    {
        options.IncludeScopes = true;
        options.MaxBatchSize = 1; // Ensure logs are displayed immediately
    });
}

// Log initialization info to help with debugging
Console.WriteLine($"Blazor WebAssembly initializing. Environment: {builder.HostEnvironment.Environment}");
Console.WriteLine($"Base Address: {builder.HostEnvironment.BaseAddress}");

// Load environment-specific configurations
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.HostEnvironment.Environment}.json", optional: true, reloadOnChange: true);

// Configure HttpClient with API base URL from config and proper caching
var apiBaseUrl = builder.Configuration.GetSection("ApiSettings:ApiBaseUrl").Value ?? builder.HostEnvironment.BaseAddress;
Console.WriteLine($"API Base URL: {apiBaseUrl}");

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
Console.WriteLine($"Database connection available: {!string.IsNullOrEmpty(connectionString)}");

if (!string.IsNullOrEmpty(connectionString))
{
    try
    {
        builder.Services.AddDbContextFactory<ApplicationDbContext>(options => {
            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
            
            // Add performance optimizations
            options.EnableSensitiveDataLogging(builder.HostEnvironment.IsDevelopment());
            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking); // Better for read-only scenarios
        });
        Console.WriteLine("Database context registered successfully");
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Error configuring database: {ex.Message}");
    }
}

// Add memory cache for better performance
builder.Services.AddMemoryCache();

// Configure dependency injection with proper lifetime management
// Register your services here
// builder.Services.AddScoped<IProjectService, ProjectService>();

try
{
    var host = builder.Build();
    Console.WriteLine("Blazor WebAssembly host built successfully, starting application...");
    await host.RunAsync();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Application startup failed: {ex.Message}");
    Console.Error.WriteLine($"Exception details: {ex.ToString()}");
}