using WebApplication1.Models.Enums;
using WebApplication1.Models.Repositories;

namespace WebApplication1.Models.Services;

public class MerchandiseService : IMerchandiseService
{
    private readonly IMerchandiseRepository _merchandiseRepository;

    public MerchandiseService(IMerchandiseRepository merchandiseRepository)
    {
        _merchandiseRepository = merchandiseRepository;
    }

    public List<MerchandiseDto> GetAllMerchandise()
    {
        return _merchandiseRepository.GetAllMerchandise();
    }

    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        return _merchandiseRepository.GetMerchandiseBySize(size);
    }

    public List<MerchandiseDto> GetMerchandiseByCategory(int category)
    {
        return _merchandiseRepository.GetMerchandiseByCategory(category);
    }

    public InsertResult InsertMerch(MerchandiseCreateDto merchandise)
    {
        // Business rule validation: Check if the merchandise already exists
        if (_merchandiseRepository.Exists(merchandise.CategoryId, merchandise.Name, merchandise.BrandId))
            return InsertResult.AlreadyExists;

        return _merchandiseRepository.InsertMerch(merchandise);
    }

    public bool DeleteMerchandiseById(int id)
    {
        return _merchandiseRepository.DeleteMerchandiseById(id);
    }

    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto)
    {
        return _merchandiseRepository.UpdateMerch(id, merchandiseUpdateDto);
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

    public int AddCategoryToDb(CategoryCreateDto categoryCreateDto)
    {
        return _merchandiseRepository.AddCategoryToDb(categoryCreateDto);
    }

    public int AddThemeToDb(ThemeCreateDto themeCreateDto)
    {
        return _merchandiseRepository.AddThemeToDb(themeCreateDto);
    }
}