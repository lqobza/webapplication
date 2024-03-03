namespace WebApplication1.Models;

public class MerchandiseDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; }
    public int InStock { get; set; }
    public int Price { get; set; }
    public string Description { get; set; }
    public int Rating { get; set; }
    public string Size { get; set; }
    public int BrandId { get; set; }

    /*public override string ToString()
    {
        return String.Format("ID: {0}, Cateory: {1}, Name: {2}, In stock: {3}, Price: {4}, Description: {5}, Rating: {6}, Size: {7}, Brand: {8}", Id,CategoryId,Name,InStock,Price,Description,Rating,Size,BrandId);
    }*/
}