using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models;

public class MerchandiseCreateDto
{
    [Required]
    [Range(0, int.MaxValue)]
    public int CategoryId { get; set; }
        
    [Required]
    [StringLength(255)]
    public string Name { get; set; }
        
    [Range(0, int.MaxValue)]
    public int InStock { get; set; }
        
    [Range(1, int.MaxValue)]
    public int Price { get; set; }
        
    [StringLength(255)]
    public string Description { get; set; }
        
    [StringLength(50)]
    public string Size { get; set; }
        
    [Required]
    public int BrandId { get; set; }
}