using WebApplication1.Services.Interface;

namespace WebApplication1.Services;

public class FileSystemImageService : IImageStorageService
{
    private readonly string _imageDirectory;

    public FileSystemImageService(IConfiguration configuration)
    {
        _imageDirectory = "wwwroot/images/merchandise"; //should add a path to configuration
        Directory.CreateDirectory(_imageDirectory);
    }

    public async Task<string> SaveImageAsync(IFormFile file, string merchandiseId)
    {
        var merchPath = Path.Combine(_imageDirectory, merchandiseId);
        Directory.CreateDirectory(merchPath);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(merchPath, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/images/merchandise/{merchandiseId}/{fileName}";
    }

    public Task DeleteImageAsync(string path)
    {
        
        if (!path.StartsWith("/images/merchandise/")) 
            return Task.CompletedTask;
      
        path = path.Replace("/images/merchandise/", "");
        var fullPath = Path.Combine(_imageDirectory, path);

        if (File.Exists(fullPath)) File.Delete(fullPath);
    
        return Task.CompletedTask;
        
    }

    public string GetImageDirectory()
    {
        return _imageDirectory;
    }
}