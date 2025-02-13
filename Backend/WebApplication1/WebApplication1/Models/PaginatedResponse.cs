namespace WebApplication1.Models;

public class PaginatedResponse<T>
{
    public PaginatedResponse()
    {
        Items = new List<T>();
    }

    public List<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
} 