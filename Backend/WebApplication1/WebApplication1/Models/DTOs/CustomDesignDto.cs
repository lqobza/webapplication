namespace WebApplication1.Models.DTOs;

public class CustomDesignDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FrontImage { get; set; } = string.Empty;
    public string BackImage { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CustomDesignCreateDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FrontImage { get; set; } = string.Empty;
    public string BackImage { get; set; } = string.Empty;
}