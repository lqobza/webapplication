using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.DTOs;
using WebApplication1.Services.Interface;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomDesignController : ControllerBase
{
    private readonly ICustomDesignService _customDesignService;
    private readonly ILogger<CustomDesignController> _logger;

    public CustomDesignController(ICustomDesignService customDesignService, ILogger<CustomDesignController> logger)
    {
        _customDesignService = customDesignService;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,User")]
    public async Task<IActionResult> CreateDesign([FromBody] CustomDesignCreateDto designDto)
    {
        _logger.LogInformation("CreateDesign endpoint called with design name: {DesignName}", designDto.Name);

        if (string.IsNullOrEmpty(designDto.Name))
        {
            _logger.LogWarning("Design name is required");
            return BadRequest("Design name is required");
        }

        if (string.IsNullOrEmpty(designDto.UserId))
        {
            _logger.LogWarning("User ID is required");
            return BadRequest("User ID is required");
        }

        if (string.IsNullOrEmpty(designDto.FrontImage))
        {
            _logger.LogWarning("Front image is required");
            return BadRequest("Front image is required");
        }

        if (string.IsNullOrEmpty(designDto.BackImage))
        {
            _logger.LogWarning("Back image is required");
            return BadRequest("Back image is required");
        }

        try
        {
            _logger.LogInformation("Creating design for user {UserId}", designDto.UserId);
            var designId = await _customDesignService.CreateDesignAsync(designDto);
            _logger.LogInformation("Design created successfully with ID: {DesignId}", designId);
            return Ok(new { Id = designId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating design: {ErrorMessage}", ex.Message);
            return StatusCode(500, "An error occurred while creating the design");
        }
    }

    [HttpGet("user/{userId}")]
    [Authorize(Roles = "Admin,User")]
    public async Task<IActionResult> GetDesignsByUserId(string userId)
    {
        _logger.LogInformation("GetDesignsByUserId endpoint called for user: {UserId}", userId);

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("User ID is required");
            return BadRequest("User ID is required");
        }

        try
        {
            var designs = await _customDesignService.GetDesignsByUserIdAsync(userId);
            _logger.LogInformation("Retrieved {Count} designs for user {UserId}", designs.Count, userId);
            return Ok(designs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving designs for user {UserId}: {ErrorMessage}", userId, ex.Message);
            return StatusCode(500, "An error occurred while retrieving designs");
        }
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,User")]
    public async Task<IActionResult> GetDesignById(int id)
    {
        _logger.LogInformation("GetDesignById endpoint called for design: {DesignId}", id);

        try
        {
            var design = await _customDesignService.GetDesignByIdAsync(id);

            if (design == null)
            {
                _logger.LogWarning("Design with ID {DesignId} not found", id);
                return NotFound($"Design with ID {id} not found");
            }

            _logger.LogInformation("Retrieved design with ID {DesignId}", id);
            return Ok(design);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving design with ID {DesignId}: {ErrorMessage}", id, ex.Message);
            return StatusCode(500, "An error occurred while retrieving the design");
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,User")]
    public async Task<IActionResult> DeleteDesign(int id)
    {
        _logger.LogInformation("DeleteDesign endpoint called for design: {DesignId}", id);

        try
        {
            var design = await _customDesignService.GetDesignByIdAsync(id);

            if (design == null)
            {
                _logger.LogWarning("Design with ID {DesignId} not found", id);
                return NotFound($"Design with ID {id} not found");
            }

            var currentUserId = User.FindFirst("userId")?.Value;
            if (currentUserId != design.UserId)
            {
                _logger.LogWarning("User {UserId} attempted to delete design {DesignId} owned by {OwnerId}",
                    currentUserId, id, design.UserId);
                return new ObjectResult("You do not have permission to delete this design")
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
            }

            await _customDesignService.DeleteDesignAsync(id);
            _logger.LogInformation("Design with ID {DesignId} deleted successfully", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting design with ID {DesignId}: {ErrorMessage}", id, ex.Message);
            return StatusCode(500, "An error occurred while deleting the design");
        }
    }
}