﻿using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;
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

    public PaginatedResponse<MerchandiseDto> SearchMerchandise(MerchandiseSearchDto searchParams)
    {
        return _merchandiseRepository.SearchMerchandise(searchParams);
    }

    public MerchandiseDto? GetMerchandiseById(int id)
    {
        return _merchandiseRepository.GetMerchandiseById(id);
    }

    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        if (string.IsNullOrWhiteSpace(size)) throw new ArgumentException("Size cannot be empty");

        size = size.Trim().ToUpper();

        return _merchandiseRepository.GetMerchandiseBySize(size);
    }

    public List<MerchandiseDto> GetMerchandiseByCategory(int category)
    {
        return _merchandiseRepository.GetMerchandiseByCategory(category);
    }

    public InsertResult InsertMerchandise(MerchandiseCreateDto merchandise)
    {
        return _merchandiseRepository.MerchandiseExists(merchandise.CategoryId, merchandise.Name, merchandise.BrandId)
            ? InsertResult.AlreadyExists
            : _merchandiseRepository.InsertMerchandise(merchandise);
    }

    public bool DeleteMerchandiseById(int id)
    {
        return _merchandiseRepository.DeleteMerchandiseById(id);
    }

    public bool UpdateMerchandise(int id, MerchandiseUpdateDto merchandiseUpdateDto)
    {
        if (id <= 0) throw new ArgumentException("Invalid merchandise ID");

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
        var result = _merchandiseRepository.AddCategoryToDb(categoryCreateDto);

        return result switch
        {
            > 0 => InsertResult.Success,
            -1 => InsertResult.AlreadyExists,
            _ => InsertResult.Error
        };
    }

    public InsertResult AddThemeToDb(ThemeCreateDto themeCreateDto)
    {
        var result = _merchandiseRepository.AddThemeToDb(themeCreateDto);

        return result switch
        {
            > 0 => InsertResult.Success,
            -1 => InsertResult.AlreadyExists,
            _ => InsertResult.Error
        };
    }

    public async Task<MerchandiseImageDto> AddMerchandiseImage(int merchandiseId, string imageUrl,
        bool isPrimary = false)
    {
        return await _imageRepository.AddImage(merchandiseId, imageUrl, isPrimary);
    }

    public async Task<bool> DeleteMerchandiseImage(int merchandiseId, string fileName)
    {
        var imagePath = Path.Combine(_imageStorageService.GetImageDirectory(), merchandiseId.ToString(), fileName);
        var fileExists = File.Exists(imagePath);

        var images = _imageRepository.GetMerchandiseImages(merchandiseId);
        var imageToDelete = images.FirstOrDefault(img => img.ImageUrl.EndsWith(fileName));

        if (imageToDelete == null)
        {
            if (fileExists) File.Delete(imagePath);
            return true;
        }

        var dbDeleteResult = await _imageRepository.DeleteImage(imageToDelete.Id);

        if (fileExists) File.Delete(imagePath);

        return dbDeleteResult;
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
        return _merchandiseRepository.MerchandiseExistsWithId(id);
    }

    public async Task<MerchandiseImageDto> UploadMerchandiseImage(int merchandiseId, IFormFile image)
    {
        if (image == null || image.Length == 0) throw new ArgumentException("No image file provided");

        if (!MerchandiseExists(merchandiseId))
            throw new KeyNotFoundException($"Merchandise with ID {merchandiseId} not found");

        try
        {
            var imageUrl = await _imageStorageService.SaveImageAsync(image, merchandiseId.ToString());

            var imageDto = await _imageRepository.AddImage(merchandiseId, imageUrl);

            return imageDto;
        }
        catch (Exception ex)
        {
            if (ex is not DbUpdateException ||
                ex.InnerException?.Message.Contains("FOREIGN KEY constraint") != true) throw;
            var imageUrl = ex.Data["ImageUrl"] as string;
            if (!string.IsNullOrEmpty(imageUrl)) await _imageStorageService.DeleteImageAsync(imageUrl);

            throw;
        }
    }
}