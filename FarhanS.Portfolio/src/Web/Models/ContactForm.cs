using System.ComponentModel.DataAnnotations;

namespace FarhanS.Portfolio.Web.Models
{
    public class ContactForm
    {
        [Required(ErrorMessage = "Please enter your name.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter your email address.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter a message.")]
        [MinLength(10, ErrorMessage = "Your message should be at least 10 characters.")]
        public string Message { get; set; } = string.Empty;
    }
}