namespace WebApplication1.Models.DTOs;

public class OrderCreateDto
{
    public int UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
}
