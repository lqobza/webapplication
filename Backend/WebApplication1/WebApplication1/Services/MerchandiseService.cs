using WebApplication1.Models;
using WebApplication1.Models.Enums;
using WebApplication1.Models.Repositories;
using WebApplication1.Services.Interface;

namespace WebApplication1.Services;

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
    
    public MerchandiseDto? GetMerchandiseById(int id)
    {
        return _merchandiseRepository.GetMerchandiseById(id);
    }

    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
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

}