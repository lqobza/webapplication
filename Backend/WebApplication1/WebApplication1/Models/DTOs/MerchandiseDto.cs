namespace WebApplication1.Models.DTOs;

public class MerchandiseDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public List<RatingDto>? Ratings { get; set; }
    public List<ThemeDto>? Themes { get; set; }
    public List<MerchSizeDto>? Sizes { get; set; }
    public List<MerchandiseImageDto> Images { get; set; } = new();
}