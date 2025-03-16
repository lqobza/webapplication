using WebApplication1.Models.DTOs;

namespace WebApplication1.Repositories.Interface;

public interface ICustomDesignRepository
{
    Task<int> CreateDesignAsync(CustomDesignCreateDto design);
    Task<List<CustomDesignDto>> GetDesignsByUserIdAsync(string userId);
    Task<CustomDesignDto?> GetDesignByIdAsync(int id);
    Task DeleteDesignAsync(int id);
} 