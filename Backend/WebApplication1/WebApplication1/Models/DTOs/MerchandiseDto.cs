namespace WebApplication1.Models;

public class MerchandiseDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public string Name { get; set; }
    public int Price { get; set; }
    public string Description { get; set; }
    public int BrandId { get; set; }
    public string BrandName { get; set; }
    public List<RatingDto>? Ratings { get; set; }
    public List<ThemeDto>? Themes { get; set; }
    public List<MerchSizeDto>? Sizes { get; set; }
}