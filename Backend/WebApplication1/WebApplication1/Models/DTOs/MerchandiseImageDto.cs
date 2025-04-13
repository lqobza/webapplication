namespace WebApplication1.Models.DTOs;

public class MerchandiseImageDto
{
    public int Id { get; set; }
    public int MerchandiseId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime CreatedAt { get; set; }
}