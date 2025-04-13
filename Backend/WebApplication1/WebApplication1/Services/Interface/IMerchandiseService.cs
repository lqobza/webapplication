using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;

namespace WebApplication1.Services.Interface;

public interface IMerchandiseService
{
    public PaginatedResponse<MerchandiseDto> GetAllMerchandise(int page = 1, int pageSize = 10);
    public PaginatedResponse<MerchandiseDto> SearchMerchandise(MerchandiseSearchDto searchParams);
    public MerchandiseDto? GetMerchandiseById(int id);
    public List<MerchandiseDto> GetMerchandiseBySize(string size);
    public List<MerchandiseDto> GetMerchandiseByCategory(int category);
    public InsertResult InsertMerchandise(MerchandiseCreateDto merchandise);
    public bool DeleteMerchandiseById(int id);
    public bool UpdateMerchandise(int id, MerchandiseUpdateDto merchandiseUpdateDto);
    public List<string>? GetSizesByCategoryId(int categoryId);
    public List<CategoryDto> GetCategories();
    public List<ThemeDto> GetThemes();
    public List<BrandDto> GetBrands();
    public InsertResult AddCategoryToDb(CategoryCreateDto categoryCreateDto);
    public InsertResult AddThemeToDb(ThemeCreateDto themeCreateDto);
    Task<MerchandiseImageDto> AddMerchandiseImage(int merchandiseId, string imageUrl, bool isPrimary = false);
    Task<bool> DeleteMerchandiseImage(int merchandiseId, string fileName);
    Task<bool> SetPrimaryImage(int merchandiseId, int imageId);
    bool MerchandiseExists(int id);
    List<MerchandiseImageDto> GetMerchandiseImages(int merchandiseId);
    Task<MerchandiseImageDto> UploadMerchandiseImage(int merchandiseId, IFormFile image);
}