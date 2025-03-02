using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using Microsoft.Data.SqlClient;

namespace WebApplication1.Repositories.Interface;

public interface IMerchandiseRepository
{
    public bool MerchandiseExists(int categoryId, string name, int brandId);
    public PaginatedResponse<MerchandiseDto> GetAllMerchandise(int page = 1, int pageSize = 10);
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
    public T ExecuteScalar<T>(string sql, params System.Data.SqlClient.SqlParameter[] parameters);
}