namespace WebApplication1.Services.Interface;

public interface IImageStorageService
{
    Task<string> SaveImageAsync(IFormFile file, string merchandiseId);
    Task DeleteImageAsync(string path);
    string GetImageDirectory();
}