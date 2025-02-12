namespace WebApplication1.Models.DTOs;

public class MerchSizeDto
{
    public int Id { get; set; }
    public int MerchId { get; set; }
    public string? Size { get; set; }
    public int InStock { get; set; }
}