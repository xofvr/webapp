using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FarhanS.Portfolio.Web.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace FarhanS.Portfolio.Web.Services
{
    public interface IContactService
    {
        Task<bool> SendContactFormAsync(ContactForm contactForm);
    }

    public class ContactService : IContactService
    {
        private readonly ILogger<ContactService> _logger;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _functionUrl;

        public ContactService(
            ILogger<ContactService> logger, 
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _logger = logger;
            _httpClient = httpClient;
            _configuration = configuration;
            
            // Get the Azure Function URL from configuration
            _functionUrl = _configuration["ContactForm:FunctionUrl"] ?? "api/SendContactEmail";
            
            _logger.LogInformation($"Contact service initialized with function URL: {_functionUrl}");
        }

        public async Task<bool> SendContactFormAsync(ContactForm contactForm)
        {
            try
            {
                _logger.LogInformation($"Sending contact form from {contactForm.Email}");
                
                // Send the form data to the Azure Function
                var response = await _httpClient.PostAsJsonAsync(_functionUrl, contactForm);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Contact form sent successfully");
                    return true;
                }
                
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Error sending contact form: {error}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while sending contact form");
                return false;
            }
        }
    }
}