using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models;

public class MerchandiseUpdateDto
{
        [Range(1, int.MaxValue)] //TODO Check if update endpoint checks for input validity
        public int? Price { get; set; }
        
        [StringLength(255)]
        public string? Description { get; set; }
}