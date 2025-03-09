using WebApplication1.Models.DTOs;

namespace WebApplication1.Repositories.Interface;

public interface IMerchandiseImageRepository
{
    Task<MerchandiseImageDto> AddImage(int merchandiseId, string imageUrl, bool isPrimary = false);
    Task<bool> DeleteImage(int imageId);
    Task<bool> SetPrimaryImage(int merchandiseId, int imageId);
    List<MerchandiseImageDto> GetMerchandiseImages(int merchandiseId);
} 