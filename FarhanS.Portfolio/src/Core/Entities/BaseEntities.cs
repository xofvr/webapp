namespace FarhanS.Portfolio.Core.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
    }

    public class Project : BaseEntity
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string ImageUrl { get; set; }
        public required string GitHubUrl { get; set; }
        public required string LiveUrl { get; set; }
        public DateTime CreatedDate { get; set; }
        public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    }

    public class Skill : BaseEntity
    {
        public required string Name { get; set; }
        public int ProficiencyLevel { get; set; } // 1-5 scale
        public required string Category { get; set; } // e.g., "Frontend", "Backend", "DevOps"
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }

    public class Experience : BaseEntity
    {
        public required string CompanyName { get; set; }
        public required string Position { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public required string Description { get; set; }
        public required string Location { get; set; }
    }
}