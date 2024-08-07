﻿using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Repositories;

public interface IMerchandiseRepository
{
    public bool Exists(int categoryId, string name, int brandId);
    public List<MerchandiseDto> GetAllMerchandise();
    public List<MerchandiseDto> GetMerchandiseBySize(String size);
    public List<MerchandiseDto> GetMerchandiseByCategory(int category);
    public InsertMerchResult InsertMerch(MerchandiseCreateDto merchandise);
    public bool DeleteMerchandiseById(int id);
    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto);
}