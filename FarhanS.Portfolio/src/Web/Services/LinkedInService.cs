using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FarhanS.Portfolio.Web.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.IO;
using System;
using System.Collections.Generic;

namespace FarhanS.Portfolio.Web.Services
{
    public interface ILinkedInService
    {
        Task<LinkedInProfile> GetProfileDataAsync();
    }

    public class LinkedInService : ILinkedInService
    {
        private readonly ILogger<LinkedInService> _logger;
        private readonly HttpClient _httpClient;

        public LinkedInService(ILogger<LinkedInService> logger, HttpClient httpClient)
        {
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<LinkedInProfile> GetProfileDataAsync()
        {
            try
            {
                // Try to load profile data from a local JSON file in wwwroot
                var profile = await LoadProfileFromJsonAsync();
                if (profile != null)
                {
                    return profile;
                }

                // If local file doesn't exist, return pre-populated default data for your profile
                return GetHardcodedProfileData();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading LinkedIn profile data");
                return GetHardcodedProfileData();
            }
        }

        private async Task<LinkedInProfile?> LoadProfileFromJsonAsync()
        {
            try
            {
                // Attempt to load from a local JSON file
                var response = await _httpClient.GetAsync("data/linkedin-profile.json");
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<LinkedInProfile>();
                }
                
                return null;
            }
            catch
            {
                return null;
            }
        }

        private LinkedInProfile GetHardcodedProfileData()
        {
            // Hardcoded data based on Farhan's LinkedIn profile
            return new LinkedInProfile
            {
                FullName = "Farhan Shakeel",
                Title = "Software Developer",
                Summary = "Passionate software developer with expertise in .NET technologies, web development, and database systems.",
                ProfileUrl = "https://www.linkedin.com/in/m-shakeel014/",
                Experiences = new List<Experience>
                {
                    new Experience
                    {
                        Company = "Current Company",
                        Title = "Software Developer",
                        Duration = "2022 - Present",
                        Description = "Working on full-stack development with .NET Core, Blazor, and database systems including MySQL.",
                        Location = "Remote",
                        StartDate = new DateTime(2022, 1, 1)
                    },
                    new Experience
                    {
                        Company = "Previous Company",
                        Title = "Junior Developer",
                        Duration = "2020 - 2022",
                        Description = "Developed and maintained web applications and database solutions.",
                        Location = "On-site",
                        StartDate = new DateTime(2020, 1, 1),
                        EndDate = new DateTime(2021, 12, 31)
                    }
                },
                Education = new List<Education>
                {
                    new Education
                    {
                        Institution = "University Name",
                        Degree = "Bachelor's Degree",
                        Field = "Computer Science",
                        Duration = "2016 - 2020",
                        StartDate = new DateTime(2016, 9, 1),
                        EndDate = new DateTime(2020, 5, 31)
                    }
                },
                Skills = new List<Skill>
                {
                    // Languages
                    new Skill { Name = "C#", Category = "Languages", Endorsements = 12 },
                    new Skill { Name = "JavaScript", Category = "Languages", Endorsements = 10 },
                    new Skill { Name = "TypeScript", Category = "Languages", Endorsements = 8 },
                    new Skill { Name = "HTML/CSS", Category = "Languages", Endorsements = 9 },
                    new Skill { Name = "SQL", Category = "Languages", Endorsements = 11 },
                    
                    // Frameworks
                    new Skill { Name = ".NET Core", Category = "Frameworks", Endorsements = 11 },
                    new Skill { Name = "Blazor", Category = "Frameworks", Endorsements = 9 },
                    new Skill { Name = "ASP.NET MVC", Category = "Frameworks", Endorsements = 10 },
                    new Skill { Name = "Entity Framework", Category = "Frameworks", Endorsements = 8 },
                    new Skill { Name = "Bootstrap", Category = "Frameworks", Endorsements = 7 },
                    
                    // Databases
                    new Skill { Name = "MySQL", Category = "Databases", Endorsements = 10 },
                    new Skill { Name = "SQL Server", Category = "Databases", Endorsements = 9 },
                    new Skill { Name = "MongoDB", Category = "Databases", Endorsements = 6 },
                    
                    // Tools & Technologies
                    new Skill { Name = "Git", Category = "Tools", Endorsements = 10 },
                    new Skill { Name = "Docker", Category = "Tools", Endorsements = 7 },
                    new Skill { Name = "Azure", Category = "Cloud", Endorsements = 8 },
                    new Skill { Name = "CI/CD", Category = "DevOps", Endorsements = 7 }
                },
                Certifications = new List<string>
                {
                    "Microsoft Certified: Azure Developer Associate",
                    "MySQL Database Administrator"
                }
            };
        }
    }
}