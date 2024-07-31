using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebApplication1.Models;
using WebApplication1.Models.Enums;
using WebApplication1.Models.Services;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchandiseController : ControllerBase
{
    private readonly IMerchandiseService _merchandiseService;
    private readonly ILogger<MerchandiseController> _logger;
    
    public MerchandiseController(IMerchandiseService merchandiseService, ILogger<MerchandiseController> logger)
    {
        _merchandiseService = merchandiseService;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetAllMercandise()
    {
        _logger.LogInformation("GetAllMerchandise endpoint called");
        
        var merchList = _merchandiseService.GetAllMerchandise();

        if (merchList.Count == 0)
        {
            _logger.LogInformation("No merchandise found");
            return NoContent();
        }

        _logger.LogInformation("Returning merchandise list");
        return Ok(merchList);
    }
    
    [HttpGet("size/{size}")]
    public IActionResult GetMerchandiseBySize(string size)
    {
        _logger.LogInformation("GetMerchandiseBySize endpoint called with size: {Size}", size);

        var merchList = _merchandiseService.GetMerchandiseBySize(size);

        if (merchList.Count == 0)
        {
            _logger.LogInformation("No merchandise found for size: {Size}", size);
            return NoContent();
        }

        _logger.LogInformation("Returning merchandise list for size: {Size}", size);
        return Ok(merchList);
    }
    
    [HttpGet("category/{category:int}")]
    public IActionResult GetMerchandiseByCategory(int category)
    {
        _logger.LogInformation("GetMerchandiseByCategory endpoint called with category: {category}", category);

        var merchList = _merchandiseService.GetMerchandiseByCategory(category);

        if (merchList.Count == 0)
        {
            _logger.LogInformation("No merchandise found for category: {category}", category);
            return NoContent();
        }

        _logger.LogInformation("Returning merchandise list for category: {category}", category);
        return Ok(merchList);
    }

    [HttpPost("")]
    public IActionResult InsertMerchandise([FromBody] MerchandiseCreateDto merchandiseCreateDto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid input data: {ModelStateErrors}", ModelState);
            return BadRequest(ModelState);
        }
        
        _logger.LogInformation("InsertMerchandise endpoint called with data: {Merchandise}", merchandiseCreateDto);
        
        var merchandise = new MerchandiseDto
        {
            CategoryId = merchandiseCreateDto.CategoryId,
            Name = merchandiseCreateDto.Name,
            InStock = merchandiseCreateDto.InStock,
            Price = merchandiseCreateDto.Price,
            Description = merchandiseCreateDto.Description,
            Size = merchandiseCreateDto.Size,
            BrandId = merchandiseCreateDto.BrandId,
        };
        
        InsertMerchResult insertMerchResult = _merchandiseService.InsertMerch(merchandise);
        if (insertMerchResult == InsertMerchResult.Success)
        {
            _logger.LogInformation("Merchandise inserted successfully: {Merchandise}", merchandise);
            return Ok(new { message = "Merchandise inserted successfully." });
        }
        else if (insertMerchResult == InsertMerchResult.AlreadyExists)
        {
            _logger.LogWarning("Merchandise already exists: {Merchandise}", merchandise);
            return Conflict(new { message = $"Merchandise {merchandise.Name} already exists in the database." });
        }
        else
        {
            _logger.LogError("Internal server error while inserting merchandise: {Merchandise}", merchandise);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Merch insert was unsuccessful due to internal server error." });
        }
    }
    
    [HttpDelete("{id:int}")]
    public IActionResult DeleteMerchandiseById(int id)
    {
        _logger.LogInformation("DeleteMerchandiseById endpoint called with id: {Id}", id);
        bool isDeleted = _merchandiseService.DeleteMerchandiseById(id);
        if (isDeleted)
        {
            _logger.LogInformation("Merchandise deleted successfully with id: {Id}", id);
            return NoContent();
        }
        else
        {
            _logger.LogWarning("Merchandise not found with id: {Id}", id);
            return NoContent(); //The outcome is the same if the merchandise was already deleted or didn't exist in the first place as if it was deleted -> its not present anymore in the DB
        }
    }
    
    [HttpPatch("{id:int}")]
    public IActionResult UpdateMerchandise(int id, [FromBody] MerchandiseUpdateDto merchandiseUpdateDto)
    {
        _logger.LogInformation("UpdateMerchandise endpoint called with data: {Merchandise}", merchandiseUpdateDto);

        try
        {
            var result = _merchandiseService.UpdateMerch(id, merchandiseUpdateDto);
            if (result)
            {
                _logger.LogInformation("Merchandise updated successfully: {Merchandise}", merchandiseUpdateDto);
                return Ok(new { message = "Merchandise updated successfully." });
            }
            else
            {
                _logger.LogWarning("Merchandise not found or no fields updated: {Merchandise}", merchandiseUpdateDto);
                return NotFound(new { message = "Merchandise not found or no fields updated." });
            }
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Error in request input: {Merchandise}", merchandiseUpdateDto);
            return StatusCode(StatusCodes.Status400BadRequest, new { message = "No update values provided" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating merchandise: {Merchandise}", merchandiseUpdateDto);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}