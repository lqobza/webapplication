using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models.DTOs;

public class MerchSizeCreateDto
{
    [Required] [StringLength(255)] public string? Size { get; set; }

    [Required] [Range(1, int.MaxValue)] public int InStock { get; set; }
}