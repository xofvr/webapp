using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace FarhanS.Functions
{
    public static class SendContactEmail
    {
        [FunctionName("SendContactEmail")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("Contact form submission received");

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            
            // Extract form data
            string name = data?.Name;
            string email = data?.Email;
            string message = data?.Message;

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(message))
            {
                log.LogWarning("Invalid contact form submission - missing required fields");
                return new BadRequestObjectResult("Please provide name, email, and message");
            }

            try
            {
                // Get API key from app settings
                var apiKey = Environment.GetEnvironmentVariable("SendGridApiKey");
                var client = new SendGridClient(apiKey);
                
                // Set up email with your correct email address
                var fromEmail = new EmailAddress("noreply@farhans.dev", "Portfolio Contact Form");
                var toEmail = new EmailAddress("farhan.shakeel@icloud.com", "Farhan S");
                
                // Create email subject
                var subject = $"New Contact Form Submission from {name}";
                
                // Create email content
                var htmlContent = $@"
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Message:</strong></p>
                <p>{message}</p>
                ";
                
                var plainTextContent = $"New Contact Form Submission\n\nName: {name}\nEmail: {email}\nMessage: {message}";
                
                // Send email
                var msg = MailHelper.CreateSingleEmail(fromEmail, toEmail, subject, plainTextContent, htmlContent);
                
                // Add a reply-to header so you can directly reply to the sender
                msg.SetReplyTo(new EmailAddress(email, name));
                
                var response = await client.SendEmailAsync(msg);
                
                if (response.StatusCode == System.Net.HttpStatusCode.Accepted || 
                    response.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    log.LogInformation($"Email sent successfully from {email}");
                    return new OkObjectResult("Message sent successfully");
                }
                else
                {
                    log.LogError($"Error sending email: {response.StatusCode}");
                    return new StatusCodeResult(500);
                }
            }
            catch (Exception ex)
            {
                log.LogError($"Exception occurred while sending email: {ex.Message}");
                return new StatusCodeResult(500);
            }
        }
    }
}