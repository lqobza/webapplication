using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models.DTOs;

public class MerchandiseUpdateDto
{
    [Range(1, int.MaxValue)]
    public int? Price { get; set; }

    [StringLength(255)] public string? Description { get; set; }
    
    public List<MerchSizeDto>? Sizes { get; set; }
}