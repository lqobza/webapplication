namespace WebApplication1.Models;

public class MerchandiseDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; }
    public int InStock { get; set; }
    public int Price { get; set; }
    public string Description { get; set; }
    public string Size { get; set; }
    public int BrandId { get; set; }
    public string BrandName { get; set; }
    public List<RatingDto>? Ratings { get; set; }
}
