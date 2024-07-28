using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Repositories;

public interface IMerchandiseRepository
{
    public bool Exists(int categoryId, string name, int brandId);
    public List<MerchandiseDto> GetAllMerchandise();
    public List<MerchandiseDto> GetMerchandiseBySize(String size);
    public InsertMerchResult InsertMerch(MerchandiseDto merchandise);
    public bool DeleteMerchandiseById(int id);
    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto);
    
}