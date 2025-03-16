using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;
using Microsoft.Extensions.Logging;

namespace WebApplication1.Services;

public class CustomDesignService : ICustomDesignService
{
    private readonly ICustomDesignRepository _customDesignRepository;
    private readonly ILogger<CustomDesignService> _logger;

    public CustomDesignService(ICustomDesignRepository customDesignRepository, ILogger<CustomDesignService> logger)
    {
        _customDesignRepository = customDesignRepository;
        _logger = logger;
    }

    public async Task<int> CreateDesignAsync(CustomDesignCreateDto design)
    {
        _logger.LogInformation("Creating design for user {UserId} with name {DesignName}", design.UserId, design.Name);
        
        try
        {
            var designId = await _customDesignRepository.CreateDesignAsync(design);
            _logger.LogInformation("Design created successfully with ID {DesignId}", designId);
            return designId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating design: {ErrorMessage}", ex.Message);
            throw;
        }
    }

    public async Task<List<CustomDesignDto>> GetDesignsByUserIdAsync(string userId)
    {
        _logger.LogInformation("Getting designs for user {UserId}", userId);
        
        try
        {
            var designs = await _customDesignRepository.GetDesignsByUserIdAsync(userId);
            _logger.LogInformation("Retrieved {Count} designs for user {UserId}", designs.Count, userId);
            return designs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting designs for user {UserId}: {ErrorMessage}", userId, ex.Message);
            throw;
        }
    }

    public async Task<CustomDesignDto?> GetDesignByIdAsync(int id)
    {
        _logger.LogInformation("Getting design with ID {DesignId}", id);
        
        try
        {
            var design = await _customDesignRepository.GetDesignByIdAsync(id);
            if (design == null)
            {
                _logger.LogWarning("Design with ID {DesignId} not found", id);
            }
            else
            {
                _logger.LogInformation("Retrieved design with ID {DesignId}", id);
            }
            return design;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting design with ID {DesignId}: {ErrorMessage}", id, ex.Message);
            throw;
        }
    }

    public async Task DeleteDesignAsync(int id)
    {
        _logger.LogInformation("Deleting design with ID {DesignId}", id);
        
        try
        {
            await _customDesignRepository.DeleteDesignAsync(id);
            _logger.LogInformation("Design with ID {DesignId} deleted successfully", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting design with ID {DesignId}: {ErrorMessage}", id, ex.Message);
            throw;
        }
    }
} 