using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Services;

public class MerchandiseService : IMerchandiseService
{
    private readonly IMerchandiseRepository _merchandiseRepository;
    private readonly IMerchandiseImageRepository _imageRepository;
    private readonly IImageStorageService _imageStorageService;

    public MerchandiseService(IMerchandiseRepository merchandiseRepository, 
                            IMerchandiseImageRepository imageRepository,
                            IImageStorageService imageStorageService)
    {
        _merchandiseRepository = merchandiseRepository;
        _imageRepository = imageRepository;
        _imageStorageService = imageStorageService;
    }

    public PaginatedResponse<MerchandiseDto> GetAllMerchandise(int page = 1, int pageSize = 10)
    {
        return _merchandiseRepository.GetAllMerchandise(page, pageSize);
    }
    
    public MerchandiseDto? GetMerchandiseById(int id)
    {
        return _merchandiseRepository.GetMerchandiseById(id);
    }

    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        if (string.IsNullOrWhiteSpace(size))
        {
            throw new ArgumentException("Size cannot be empty");
        }

        size = size.Trim().ToUpper();
        
        return _merchandiseRepository.GetMerchandiseBySize(size);
    }

    public List<MerchandiseDto> GetMerchandiseByCategory(int category)
    {
        return _merchandiseRepository.GetMerchandiseByCategory(category);
    }

    public InsertResult InsertMerchandise(MerchandiseCreateDto merchandise)
    {
        if (_merchandiseRepository.MerchandiseExists(merchandise.CategoryId, merchandise.Name, merchandise.BrandId))
            return InsertResult.AlreadyExists;

        return _merchandiseRepository.InsertMerchandise(merchandise);
    }

    public bool DeleteMerchandiseById(int id)
    {
        return _merchandiseRepository.DeleteMerchandiseById(id);
    }

    public bool UpdateMerchandise(int id, MerchandiseUpdateDto merchandiseUpdateDto)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid merchandise ID");
        }

        return _merchandiseRepository.UpdateMerchandise(id, merchandiseUpdateDto);
    }

    public List<string>? GetSizesByCategoryId(int categoryId)
    {
        return _merchandiseRepository.GetSizesByCategoryId(categoryId);
    }


    public List<CategoryDto> GetCategories()
    {
        return _merchandiseRepository.GetCategories();
    }

    public List<ThemeDto> GetThemes()
    {
        return _merchandiseRepository.GetThemes();
    }

    public List<BrandDto> GetBrands()
    {
        return _merchandiseRepository.GetBrands();
    }

    public InsertResult AddCategoryToDb(CategoryCreateDto categoryCreateDto)
    {
        int result = _merchandiseRepository.AddCategoryToDb(categoryCreateDto);

        if (result > 0)  // valid category ID returned
        {
            return InsertResult.Success;
        }
        if (result == -1)
        {
            return InsertResult.AlreadyExists;
        }

        return InsertResult.Error;
    }

    public InsertResult AddThemeToDb(ThemeCreateDto themeCreateDto)
    {
        int result = _merchandiseRepository.AddThemeToDb(themeCreateDto);

        if (result > 0)  // valid theme ID returned
        {
            return InsertResult.Success;
        }
        if (result == -1)
        {
            return InsertResult.AlreadyExists;
        }

        return InsertResult.Error;
    }

    public async Task<MerchandiseImageDto> AddMerchandiseImage(int merchandiseId, string imageUrl, bool isPrimary = false)
    {
        return await _imageRepository.AddImage(merchandiseId, imageUrl, isPrimary);
    }

    public async Task<bool> DeleteMerchandiseImage(int imageId)
    {
        return await _imageRepository.DeleteImage(imageId);
    }

    public async Task<bool> SetPrimaryImage(int merchandiseId, int imageId)
    {
        return await _imageRepository.SetPrimaryImage(merchandiseId, imageId);
    }

    public List<MerchandiseImageDto> GetMerchandiseImages(int merchandiseId)
    {
        return _imageRepository.GetMerchandiseImages(merchandiseId);
    }

    public bool MerchandiseExists(int id)
    {
        // Use raw SQL to check the Merch table directly
        var sql = "SELECT COUNT(1) FROM Merch WHERE id = @id";
        var parameters = new[] { new System.Data.SqlClient.SqlParameter("@id", id) };
        var exists = _merchandiseRepository.ExecuteScalar<int>(sql, parameters) > 0;
        return exists;
    }

    public async Task<MerchandiseImageDto> UploadMerchandiseImage(int merchandiseId, IFormFile image)
    {
        if (image == null || image.Length == 0)
        {
            throw new ArgumentException("No image file provided");
        }
        
        // Check if merchandise exists
        if (!MerchandiseExists(merchandiseId))
        {
            throw new KeyNotFoundException($"Merchandise with ID {merchandiseId} not found");
        }
        
        try
        {
            // Save the image file
            var imageUrl = await _imageStorageService.SaveImageAsync(image, merchandiseId.ToString());
            
            // Add image record to database
            var imageDto = await _imageRepository.AddImage(merchandiseId, imageUrl);
            
            return imageDto;
        }
        catch (Exception ex)
        {
            // If database operation fails, clean up the saved file
            if (ex is DbUpdateException && ex.InnerException?.Message.Contains("FOREIGN KEY constraint") == true)
            {
                // Try to get the image URL from exception data
                var imageUrl = ex.Data["ImageUrl"] as string;
                if (!string.IsNullOrEmpty(imageUrl))
                {
                    await _imageStorageService.DeleteImageAsync(imageUrl);
                }
            }
            
            throw; // Re-throw the exception to be handled by the controller
        }
    }
}