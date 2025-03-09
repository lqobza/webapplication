namespace WebApplication1.Models;

public class MerchandiseImage
{
    public int Id { get; set; }
    public int MerchId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public virtual Merchandise Merchandise { get; set; } = null!;
} 