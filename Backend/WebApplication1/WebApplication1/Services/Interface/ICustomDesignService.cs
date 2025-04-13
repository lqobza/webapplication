using WebApplication1.Models.DTOs;

namespace WebApplication1.Services.Interface;

public interface ICustomDesignService
{
    Task<int> CreateDesignAsync(CustomDesignCreateDto design);
    Task<List<CustomDesignDto>> GetDesignsByUserIdAsync(string userId);
    Task<CustomDesignDto?> GetDesignByIdAsync(int id);
    Task DeleteDesignAsync(int id);
}