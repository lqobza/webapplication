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
}
