namespace WebApplication1.Models;

public class Merchandise
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public int BrandId { get; set; }
    
    public virtual ICollection<MerchandiseImage> Images { get; set; } = new List<MerchandiseImage>();
} 