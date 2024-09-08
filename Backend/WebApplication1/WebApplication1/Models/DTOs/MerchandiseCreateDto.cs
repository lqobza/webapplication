using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models;

public class MerchandiseCreateDto
{
    [Required] [Range(0, int.MaxValue)] public int CategoryId { get; set; }

    [Required] [StringLength(255)] public string Name { get; set; } = string.Empty;

    [Required] [Range(1, int.MaxValue)] public int Price { get; set; }

    [Required] [StringLength(255)] public string Description { get; set; } = string.Empty;

    [Required] public int BrandId { get; set; }

    public List<int>? ThemeIds { get; set; }

    public List<MerchSizeCreateDto>? Sizes { get; set; }
}