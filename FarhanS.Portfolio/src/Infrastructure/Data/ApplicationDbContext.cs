using Microsoft.EntityFrameworkCore;
using FarhanS.Portfolio.Core.Entities;

namespace FarhanS.Portfolio.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Define your DbSets here
        public DbSet<Project> Projects { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<Experience> Experiences { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Add any entity configurations here
            modelBuilder.Entity<Project>()
                .HasMany(p => p.Skills)
                .WithMany(s => s.Projects);
        }
    }
}