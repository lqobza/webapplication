using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models;

public class RatingCreateDto
{
    [Required]
    [Range(0, int.MaxValue)]
    public int MerchId { get; set; }
    
    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }
    
    [StringLength(255)]
    public string? Description { get; set; }
}