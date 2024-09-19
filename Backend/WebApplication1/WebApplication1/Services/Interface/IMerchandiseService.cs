using WebApplication1.Models;
using WebApplication1.Models.Enums;

namespace WebApplication1.Services.Interface;

public interface IMerchandiseService
{
    public List<MerchandiseDto> GetAllMerchandise();
    public List<MerchandiseDto> GetMerchandiseBySize(string size);
    public List<MerchandiseDto> GetMerchandiseByCategory(int category);
    public InsertResult InsertMerch(MerchandiseCreateDto merchandise);
    public bool DeleteMerchandiseById(int id);
    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto);
    public List<string>? GetSizesByCategoryId(int categoryId);
    public List<CategoryDto> GetCategories();
    public List<ThemeDto> GetThemes();
    public List<BrandDto> GetBrands();
    public int AddCategoryToDb(CategoryCreateDto categoryCreateDto);
    public int AddThemeToDb(ThemeCreateDto themeCreateDto);
}