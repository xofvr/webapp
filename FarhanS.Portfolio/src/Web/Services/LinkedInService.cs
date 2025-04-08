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
                        Description = "Built MLOps pipelines using Azure Machine Learning for scientific instruments. Developed mathematical models for calorimeter systems and created simulation code for light diffraction analysis. Deployed a context-aware documentation chatbot using vector storage and Azure ML Studio.",
                        Location = "Bristol, UK",
                        StartDate = new DateTime(2023, 7, 1),
                        EndDate = new DateTime(2024, 7, 1)
                    },
                    new Experience
                    {
                        Company = "UWE, Bristol",
                        Title = "Student Ambassador",
                        Duration = "11/2022 - 04/2023",
                        Description = "Represented the university at open days and recruitment events. Guided prospective students and families during campus tours, sharing first-hand experience of university life and answering questions about courses and facilities.",
                        Location = "Bristol, UK",
                        StartDate = new DateTime(2022, 11, 1),
                        EndDate = new DateTime(2023, 4, 30)
                    },
                    new Experience
                    {
                        Company = "Hollister Co.",
                        Title = "Brand Representative",
                        Duration = "12/2021 - 01/2022",
                        Description = "Delivered customer service.",
                        Location = "Bristol, UK",
                        StartDate = new DateTime(2021, 12, 1),
                        EndDate = new DateTime(2022, 1, 31)
                    },
                    new Experience
                    {
                        Company = "Al Babtain Auto",
                        Title = "Intern",
                        Duration = "08/2021 - 09/2021",
                        Description = "Researched market data and created presentations for management. Contributed to the company's social media presence and helped with the development of their e-commerce website.",
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
                        Duration = "2021 - 2025",
                        StartDate = new DateTime(2021, 9, 1),
                        EndDate = new DateTime(2025, 6, 1)
                    }
                },
                Skills = new List<Skill>
                {
                    // Languages
                    new Skill { Name = "Python", Category = "Languages" },
                    new Skill { Name = "C#", Category = "Languages" },
                    new Skill { Name = "C++", Category = "Languages" },
                    new Skill { Name = "JavaScript", Category = "Languages" },
                    new Skill { Name = "TypeScript", Category = "Languages"},
                    new Skill { Name = "HTML/CSS", Category = "Languages"},
                    new Skill { Name = "MySQL", Category = "Languages" },
                    
                    // Data Science
                    new Skill { Name = "Machine Learning", Category = "Data Science"},
                    new Skill { Name = "Data Analysis", Category = "Data Science"},
                    new Skill { Name = "Pandas", Category = "Data Science"},
                    new Skill { Name = "NumPy", Category = "Data Science"},
                    new Skill { Name = "Scikit-learn", Category = "Data Science"},
                    new Skill { Name = "TensorFlow", Category = "Data Science"},
                    new Skill { Name = "Statistical Modeling", Category = "Data Science"},
                    
                    // Frameworks
                    new Skill { Name = ".NET Core", Category = "Frameworks"},
                    new Skill { Name = "Blazor", Category = "Frameworks"},
                    new Skill { Name = "Flask", Category = "Frameworks"},
                    new Skill { Name = "Django", Category = "Frameworks"},
                    
                    // Databases
                    new Skill { Name = "MySQL", Category = "Databases"},
                    new Skill { Name = "SQL Server", Category = "Databases"},
                    new Skill { Name = "MongoDB", Category = "Databases"},
                    new Skill { Name = "PostgreSQL", Category = "Databases"},
                    
                    // Tools & Technologies
                    new Skill { Name = "Git", Category = "Tools"},
                    new Skill { Name = "Docker", Category = "Tools"},
                    new Skill { Name = "Azure", Category = "Cloud"},
                    new Skill { Name = "CI/CD", Category = "DevOps"},
                    new Skill { Name = "Jupyter", Category = "Tools"},
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