using WebApplication1.Models;
using WebApplication1.Models.Enums;

namespace WebApplication1.Repositories.Interface;

public interface IMerchandiseRepository
{
    public bool MerchandiseExists(int categoryId, string name, int brandId);
    public List<MerchandiseDto> GetAllMerchandise();
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
    public int AddCategoryToDb(CategoryCreateDto categoryCreateDto);
    public int AddThemeToDb(ThemeCreateDto themeCreateDto);
}