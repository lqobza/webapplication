namespace WebApplication1.Models.DTOs;

public class OrderItemCreateDto
{
    public int OrderId { get; set; }
    public int MerchId { get; set; }
    public string Size { get; set; } = string.Empty;
    public int Quantity { get; set; }
}