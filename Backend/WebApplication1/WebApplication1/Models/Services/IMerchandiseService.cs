using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Services;

public interface IMerchandiseService
{
    public List<MerchandiseDto> GetAllMerchandise();
    public List<MerchandiseDto> GetMerchandiseBySize(String size);
    public List<MerchandiseDto> GetMerchandiseByCategory(int category);
    public InsertMerchResult InsertMerch(MerchandiseDto merchandise);
    public bool DeleteMerchandiseById(int id);
    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto);
}