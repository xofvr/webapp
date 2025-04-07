using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.EntityFrameworkCore;
using FarhanS.Portfolio;
using FarhanS.Portfolio.Infrastructure.Data;
using FarhanS.Portfolio.Web;
using FarhanS.Portfolio.Web.Services;
using System.Net.Http.Headers;
using Microsoft.Extensions.Caching.Memory;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure detailed logging for better error diagnosis
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Log initialization info to help with debugging
Console.WriteLine($"Blazor WebAssembly initializing. Environment: {builder.HostEnvironment.Environment}");
Console.WriteLine($"Base Address: {builder.HostEnvironment.BaseAddress}");

// Load environment-specific configurations
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.HostEnvironment.Environment}.json", optional: true, reloadOnChange: true);

// Configure HttpClient with API base URL from config
var apiBaseUrl = builder.Configuration.GetSection("ApiSettings:ApiBaseUrl").Value ?? builder.HostEnvironment.BaseAddress;
Console.WriteLine($"API Base URL: {apiBaseUrl}");

// Add memory cache with optimized settings for better performance
builder.Services.AddMemoryCache(options =>
{
    // Set reasonable size limits for client-side cache
    options.SizeLimit = 1024;
    // Scan for expired items every 30 seconds (not too frequent to reduce overhead)
    options.ExpirationScanFrequency = TimeSpan.FromSeconds(30);
});

// Add HttpClient with optimized performance settings
builder.Services.AddScoped(sp => {
    var httpClient = new HttpClient { BaseAddress = new Uri(apiBaseUrl) };
    
    // Enable response compression
    httpClient.DefaultRequestHeaders.AcceptEncoding.Add(new StringWithQualityHeaderValue("gzip"));
    httpClient.DefaultRequestHeaders.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));
    
    // Add default headers for better API performance
    httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    
    // Add user agent for analytics
    httpClient.DefaultRequestHeaders.UserAgent.Add(
        new ProductInfoHeaderValue("FarhansPortfolio", "1.0.0"));
    
    return httpClient;
});

// Register Services with appropriate lifetimes
builder.Services.AddScoped<ILinkedInService, LinkedInService>();

// Register DbContext if connection string is available
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"Database connection available: {!string.IsNullOrEmpty(connectionString)}");

if (!string.IsNullOrEmpty(connectionString))
{
    try
    {
        builder.Services.AddDbContextFactory<ApplicationDbContext>(options => {
            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), 
                sqlOptions => {
                    // Enable retrying failed database operations
                    sqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
                    // Optimize command timeout
                    sqlOptions.CommandTimeout(15);
                });
            
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