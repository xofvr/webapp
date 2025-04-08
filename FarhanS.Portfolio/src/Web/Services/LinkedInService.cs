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
            // Hardcoded data based on Farhan's LinkedIn profile, combining both Software Development and Data Science CVs
            return new LinkedInProfile
            {
                FullName = "Farhan Shakeel",
                Title = "Data Scientist & Software Engineer",
                Summary = "Data science professional with software engineering background, experienced in machine learning, predictive analytics, and full-stack development using .NET technologies.",
                ProfileUrl = "https://www.linkedin.com/in/m-shakeel014/",
                Experiences = new List<Experience>
                {
                    new Experience
                    {
                        Company = "Malvern Panalytical",
                        Title = "Assistant Data Scientist",
                        Duration = "07/2023 - 07/2024",
                        Description = "Developed data processing pipelines and machine learning models for material analysis. Applied statistical methods to research data and implemented automated workflows for data preparation and analysis. Collaborated with cross-functional teams to deliver data-driven insights.",
                        Location = "UK",
                        StartDate = new DateTime(2023, 7, 1),
                        EndDate = new DateTime(2024, 7, 1)
                    },
                    new Experience
                    {
                        Company = "UWE, Bristol",
                        Title = "Student Ambassador",
                        Duration = "11/2022 - 04/2023",
                        Description = "Assisted new students in adapting to university life and academic requirements. Organized student activities and provided guidance on university resources and opportunities.",
                        Location = "Bristol, UK",
                        StartDate = new DateTime(2022, 11, 1),
                        EndDate = new DateTime(2023, 4, 30)
                    },
                    new Experience
                    {
                        Company = "Hollister Co.",
                        Title = "Brand Representative",
                        Duration = "12/2021 - 01/2022",
                        Description = "Represented the brand and assisted customers. Provided excellent customer service while maintaining store presentation standards.",
                        Location = "UK",
                        StartDate = new DateTime(2021, 12, 1),
                        EndDate = new DateTime(2022, 1, 31)
                    },
                    new Experience
                    {
                        Company = "Al Babtain Auto",
                        Title = "Intern",
                        Duration = "08/2021 - 09/2021",
                        Description = "Gained practical experience in business operations. Assisted with data entry and analysis tasks.",
                        Location = "Kuwait",
                        StartDate = new DateTime(2021, 8, 1),
                        EndDate = new DateTime(2021, 9, 30)
                    }
                },
                Education = new List<Education>
                {
                    new Education
                    {
                        Institution = "University of the West of England, Bristol",
                        Degree = "BSc (Hons)",
                        Field = "Computer Science",
                        Duration = "2021 - 2024",
                        StartDate = new DateTime(2021, 9, 1),
                        EndDate = new DateTime(2024, 6, 30)
                    }
                },
                Skills = new List<Skill>
                {
                    // Languages
                    new Skill { Name = "Python", Category = "Languages", Endorsements = 14 },
                    new Skill { Name = "R", Category = "Languages", Endorsements = 11 },
                    new Skill { Name = "C#", Category = "Languages", Endorsements = 12 },
                    new Skill { Name = "JavaScript", Category = "Languages", Endorsements = 10 },
                    new Skill { Name = "TypeScript", Category = "Languages", Endorsements = 8 },
                    new Skill { Name = "HTML/CSS", Category = "Languages", Endorsements = 9 },
                    new Skill { Name = "SQL", Category = "Languages", Endorsements = 11 },
                    
                    // Data Science
                    new Skill { Name = "Machine Learning", Category = "Data Science", Endorsements = 13 },
                    new Skill { Name = "Data Analysis", Category = "Data Science", Endorsements = 12 },
                    new Skill { Name = "Pandas", Category = "Data Science", Endorsements = 11 },
                    new Skill { Name = "NumPy", Category = "Data Science", Endorsements = 10 },
                    new Skill { Name = "Scikit-learn", Category = "Data Science", Endorsements = 10 },
                    new Skill { Name = "TensorFlow", Category = "Data Science", Endorsements = 9 },
                    new Skill { Name = "Statistical Modeling", Category = "Data Science", Endorsements = 10 },
                    
                    // Frameworks
                    new Skill { Name = ".NET Core", Category = "Frameworks", Endorsements = 11 },
                    new Skill { Name = "Blazor", Category = "Frameworks", Endorsements = 9 },
                    new Skill { Name = "ASP.NET MVC", Category = "Frameworks", Endorsements = 10 },
                    new Skill { Name = "Entity Framework", Category = "Frameworks", Endorsements = 8 },
                    new Skill { Name = "Flask", Category = "Frameworks", Endorsements = 9 },
                    new Skill { Name = "Django", Category = "Frameworks", Endorsements = 8 },
                    
                    // Databases
                    new Skill { Name = "MySQL", Category = "Databases", Endorsements = 10 },
                    new Skill { Name = "SQL Server", Category = "Databases", Endorsements = 9 },
                    new Skill { Name = "MongoDB", Category = "Databases", Endorsements = 6 },
                    new Skill { Name = "PostgreSQL", Category = "Databases", Endorsements = 7 },
                    
                    // Tools & Technologies
                    new Skill { Name = "Git", Category = "Tools", Endorsements = 10 },
                    new Skill { Name = "Docker", Category = "Tools", Endorsements = 7 },
                    new Skill { Name = "Azure", Category = "Cloud", Endorsements = 8 },
                    new Skill { Name = "CI/CD", Category = "DevOps", Endorsements = 7 },
                    new Skill { Name = "Jupyter", Category = "Tools", Endorsements = 12 },
                    new Skill { Name = "Power BI", Category = "Tools", Endorsements = 9 }
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