using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Services;

public interface IMerchandiseService
{
    public List<MerchandiseDto> GetAllMerchandise();
    public List<MerchandiseDto> GetMerchandiseBySize(string size);
    public List<MerchandiseDto> GetMerchandiseByCategory(int category);
    public InsertMerchResult InsertMerch(MerchandiseCreateDto merchandise);
    public bool DeleteMerchandiseById(int id);
    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto);
    public List<string>? GetSizesByCategoryId(int categoryId);
    public List<CategoryDto> GetCategories();
    public List<ThemeDto> GetThemes();
    public int AddCategoryToDb(CreateCategoryDto createCategoryDto);
    public int AddThemeToDb(CreateThemeDto createThemeDto);
}