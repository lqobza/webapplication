using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

public interface IImageStorageService
{
    Task<string> SaveImageAsync(IFormFile file, string merchandiseId);
    Task DeleteImageAsync(string path);
}

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

    public Task DeleteImageAsync(string path)
    {
        throw new NotImplementedException();
    }
} 