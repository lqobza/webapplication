using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;

namespace WebApplication1.Utils;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ApplicationUser> Users { get; set; }
    public DbSet<MerchandiseImage> MerchandiseImages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.Role).HasMaxLength(20).HasDefaultValue("User");
        });

        modelBuilder.Entity<MerchandiseImage>(entity =>
        {
            entity.ToTable("MerchandiseImages");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.HasOne(mi => mi.Merchandise)
                .WithMany(m => m.Images)
                .HasForeignKey(mi => mi.MerchId)
                .HasPrincipalKey(m => m.Id);
        });

        modelBuilder.Entity<Merchandise>(entity =>
        {
            entity.ToTable("Merch");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.HasMany(m => m.Images)
                .WithOne(mi => mi.Merchandise)
                .HasForeignKey(mi => mi.MerchId)
                .HasPrincipalKey(m => m.Id);
        });
    }
}
