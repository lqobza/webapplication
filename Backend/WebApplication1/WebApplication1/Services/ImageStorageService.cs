using WebApplication1.Services.Interface;

namespace WebApplication1.Services;

public class FileSystemImageService : IImageStorageService
{
    private readonly string _imageDirectory;
    
    public FileSystemImageService(IConfiguration configuration)
    {
        _imageDirectory = configuration["ImageStorage:Path"] ?? "wwwroot/images/merchandise";
        Directory.CreateDirectory(_imageDirectory);
    }

    public async Task<string> SaveImageAsync(IFormFile file, string merchandiseId)
    {
        var merchPath = Path.Combine(_imageDirectory, merchandiseId);
        Directory.CreateDirectory(merchPath);
        
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(merchPath, fileName);
        
        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);
        
        return $"/images/merchandise/{merchandiseId}/{fileName}";
    }

    public async Task DeleteImageAsync(string path)
    {
        // Convert URL path to file system path
        if (path.StartsWith("/images/merchandise/"))
        {
            path = path.Replace("/images/merchandise/", "");
            var fullPath = Path.Combine(_imageDirectory, path);
            
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
    }

    public string GetImageDirectory()
    {
        return _imageDirectory;
    }
}