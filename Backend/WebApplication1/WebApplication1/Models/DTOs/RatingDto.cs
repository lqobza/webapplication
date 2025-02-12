namespace WebApplication1.Models.DTOs;

public class RatingDto
{
    public int Id { get; set; }
    public int MerchId { get; set; }
    public int Rating { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}