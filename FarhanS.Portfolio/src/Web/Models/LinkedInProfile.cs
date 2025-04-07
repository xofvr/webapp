using System;
using System.Collections.Generic;

namespace FarhanS.Portfolio.Web.Models
{
    public class LinkedInProfile
    {
        public string FullName { get; set; } = "Farhan S.";
        public string Title { get; set; } = "Software Developer";
        public string Summary { get; set; } = "";
        public string ProfileImageUrl { get; set; } = "";
        public string ProfileUrl { get; set; } = "https://www.linkedin.com/in/m-shakeel014/";
        public List<Experience> Experiences { get; set; } = new List<Experience>();
        public List<Education> Education { get; set; } = new List<Education>();
        public List<Skill> Skills { get; set; } = new List<Skill>();
        public List<string> Certifications { get; set; } = new List<string>();
    }

    public class Experience
    {
        public string Company { get; set; } = "";
        public string Title { get; set; } = "";
        public string Duration { get; set; } = "";
        public string Description { get; set; } = "";
        public string Location { get; set; } = "";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class Education
    {
        public string Institution { get; set; } = "";
        public string Degree { get; set; } = "";
        public string Field { get; set; } = "";
        public string Duration { get; set; } = "";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class Skill
    {
        public string Name { get; set; } = "";
        public string Category { get; set; } = ""; // e.g., Languages, Frameworks, Tools
        public int Endorsements { get; set; }
    }
}