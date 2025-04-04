namespace FarhanS.Portfolio.Core.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
    }

    public class Project : BaseEntity
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public string GitHubUrl { get; set; }
        public string LiveUrl { get; set; }
        public DateTime CreatedDate { get; set; }
        public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    }

    public class Skill : BaseEntity
    {
        public string Name { get; set; }
        public int ProficiencyLevel { get; set; } // 1-5 scale
        public string Category { get; set; } // e.g., "Frontend", "Backend", "DevOps"
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }

    public class Experience : BaseEntity
    {
        public string CompanyName { get; set; }
        public string Position { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
    }
}