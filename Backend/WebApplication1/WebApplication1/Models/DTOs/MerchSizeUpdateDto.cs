using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models;

public class MerchSizeUpdateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int InStock { get; set; }
}
