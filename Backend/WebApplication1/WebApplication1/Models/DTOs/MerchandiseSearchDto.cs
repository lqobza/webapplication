namespace WebApplication1.Models.DTOs;

public class MerchandiseSearchDto
{
    public string? Keywords { get; set; }
    public int? MinPrice { get; set; }
    public int? MaxPrice { get; set; }
    public int? CategoryId { get; set; }
    public SortOption? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public enum SortOption
{
    NameAsc,
    NameDesc,
    PriceAsc,
    PriceDesc
} 