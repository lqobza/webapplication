using Microsoft.AspNetCore.Mvc;
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

    public List<MerchandiseDto> GetMerchandiseBySize(String size)
    {
        return _merchandiseRepository.GetMerchandiseBySize(size);
    }

    public List<MerchandiseDto> GetMerchandiseByCategory(int category)
    {
        return _merchandiseRepository.GetMerchandiseByCategory(category);
    }

    public InsertMerchResult InsertMerch(MerchandiseDto merchandise)
    {
        
        // Business rule validation: Check if the merchandise already exists
        if (_merchandiseRepository.Exists(merchandise.CategoryId, merchandise.Name, merchandise.BrandId))
        {
            return InsertMerchResult.AlreadyExists;
        }
        
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
}