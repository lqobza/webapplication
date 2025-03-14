namespace WebApplication1.Models.DTOs;

public class OrderMessageDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool IsFromAdmin { get; set; }
    public bool IsRead { get; set; } = false;
}

public class OrderMessageCreateDto
{
    public int OrderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsFromAdmin { get; set; }
} 