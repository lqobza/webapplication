using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using WebApplication1.Models.Enums;
using WebApplication1.Services.Interface;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchandiseController : ControllerBase
{
    private readonly ILogger<MerchandiseController> _logger;
    private readonly IMerchandiseService _merchandiseService;

    public MerchandiseController(IMerchandiseService merchandiseService, ILogger<MerchandiseController> logger)
    {
        _merchandiseService = merchandiseService;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetAllMerchandise()
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

        if (merchList.Count is 0)
        {
            _logger.LogInformation("No merchandise found for category: {category}", category);
            return NoContent();
        }

        _logger.LogInformation("Returning merchandise list for category: {category}", category);
        return Ok(merchList);
    }
    
    //[Authorize(Roles = "Admin")]
    [HttpPost("")]
    public IActionResult InsertMerchandise([FromBody] MerchandiseCreateDto merchandiseCreateDto)
    {
        _logger.LogInformation("InsertMerchandise endpoint called with data: {Merchandise}", merchandiseCreateDto);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid input data: {ModelStateErrors}", ModelState);
            return BadRequest(ModelState);
        }

        var insertMerchResult = _merchandiseService.InsertMerchandise(merchandiseCreateDto);
        if (insertMerchResult == InsertResult.Success)
        {
            _logger.LogInformation("Merchandise inserted successfully: {Merchandise}", merchandiseCreateDto);
            return Ok(new { message = "Merchandise inserted successfully." });
        }
        if (insertMerchResult == InsertResult.AlreadyExists)

        {
            _logger.LogWarning("Merchandise already exists: {Merchandise}", merchandiseCreateDto);
            return Conflict(
                new { message = $"Merchandise {merchandiseCreateDto.Name} already exists in the database." });
        }

        _logger.LogError("Internal server error while inserting merchandise: {Merchandise}", merchandiseCreateDto);
        return StatusCode(StatusCodes.Status500InternalServerError,
            new { message = "Merch insert was unsuccessful due to internal server error." });
    }

    //[Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public IActionResult DeleteMerchandiseById(int id)
    {
        _logger.LogInformation("DeleteMerchandiseById endpoint called with id: {Id}", id);
        var isDeleted = _merchandiseService.DeleteMerchandiseById(id);
        if (isDeleted)
        {
            _logger.LogInformation("Merchandise deleted successfully with id: {Id}", id);
            return NoContent();
        }

        _logger.LogWarning("Merchandise not found with id: {Id}", id);
        return
            NoContent();
    }

    //[Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}")]
    public IActionResult UpdateMerchandise(int id, [FromBody] MerchandiseUpdateDto merchandiseUpdateDto)
    {
        _logger.LogInformation("UpdateMerchandise endpoint called with data: {Merchandise}", merchandiseUpdateDto);

        try
        {
            var result = _merchandiseService.UpdateMerchandise(id, merchandiseUpdateDto);
            if (result)
            {
                _logger.LogInformation("Merchandise updated successfully: {Merchandise}", merchandiseUpdateDto);
                return Ok(new { message = "Merchandise updated successfully." });
            }

            _logger.LogWarning("Merchandise not found or no fields updated: {Merchandise}", merchandiseUpdateDto);
            return NotFound(new { message = "Merchandise not found or no fields updated." });
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

    [HttpGet("sizes/{categoryId:int}")]
    public IActionResult GetSizesByCategoryId(int categoryId)
    {
        _logger.LogInformation("GetSizesByCategoryId endpoint called with categoryId: {categoryId}", categoryId);

        var sizes = _merchandiseService.GetSizesByCategoryId(categoryId);
        if (sizes == null) return BadRequest("Invalid CategoryId.");

        return Ok(sizes);
    }

    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        _logger.LogInformation("GetCategories endpoint called");

        var categories = _merchandiseService.GetCategories();
        return Ok(categories);
    }

    [HttpGet("themes")]
    public IActionResult GetThemes()
    {
        _logger.LogInformation("GetThemes endpoint called");

        var themes = _merchandiseService.GetThemes();
        return Ok(themes);
    }
    
    [HttpGet("brands")]
    public IActionResult GetBrands()
    {
        _logger.LogInformation("GetBrands endpoint called");

        var brands = _merchandiseService.GetBrands();
        return Ok(brands);
    }

    //[Authorize(Roles = "Admin")]
    [HttpPost("categories")]
    public IActionResult AddCategoryToDb([FromBody] CategoryCreateDto categoryCreateDto)
    {
        _logger.LogInformation("AddCategoryToDb endpoint called with data: {}", categoryCreateDto.Name);

        if (string.IsNullOrWhiteSpace(categoryCreateDto.Name)) return BadRequest("Category name is required.");
        var insertCategoryResult = _merchandiseService.AddCategoryToDb(categoryCreateDto);
        
        if (insertCategoryResult == InsertResult.Success)
        {
            _logger.LogInformation("Category inserted successfully: {}", categoryCreateDto.Name);
            return Ok(new { message = "Category inserted successfully." });
        }
        
        if (insertCategoryResult == InsertResult.AlreadyExists)
        {
            _logger.LogWarning("Category already exists: {}", categoryCreateDto.Name);
            return Conflict(
                new { message = $"Category {categoryCreateDto.Name} already exists in the database." });
        }

        _logger.LogError("Internal server error while inserting category: {}", categoryCreateDto.Name);
        return StatusCode(StatusCodes.Status500InternalServerError,
            new { message = "Category insert was unsuccessful due to internal server error." });
    }
    
    //[Authorize(Roles = "Admin")]
    [HttpPost("themes")]
    public IActionResult AddThemeToDb([FromBody] ThemeCreateDto themeCreateDto)
    {
        _logger.LogInformation("AddThemeToDb endpoint called with data: {}", themeCreateDto.Name);

        if (string.IsNullOrWhiteSpace(themeCreateDto.Name)) return BadRequest("Theme name is required.");
        var insertThemeResult = _merchandiseService.AddThemeToDb(themeCreateDto);
        
        if (insertThemeResult == InsertResult.Success)
        {
            _logger.LogInformation("Theme inserted successfully: {}", themeCreateDto.Name);
            return Ok(new { message = "Theme inserted successfully." });
        }
        
        if (insertThemeResult == InsertResult.AlreadyExists)
        {
            _logger.LogWarning("Theme already exists: {}", themeCreateDto.Name);
            return Conflict(
                new { message = $"Theme {themeCreateDto.Name} already exists in the database." });
        }

        _logger.LogError("Internal server error while inserting theme: {}", themeCreateDto.Name);
        return StatusCode(StatusCodes.Status500InternalServerError,
            new { message = "Theme insert was unsuccessful due to internal server error." });
    }
}