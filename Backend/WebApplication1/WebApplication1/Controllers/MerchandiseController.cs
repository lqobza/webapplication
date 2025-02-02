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
            _logger.LogWarning("No merchandise found");
            return NotFound(new { message = "No merchandise found." });
        }

        _logger.LogInformation("Returning merchandise list (count: {Count})", merchList.Count);
        return Ok(merchList);
    }

    [HttpGet("{id:int}")]
    public IActionResult GetMerchandiseById(int id)
    {
        _logger.LogInformation("GetMerchandiseById endpoint called for ID: {id}", id);

        var merch = _merchandiseService.GetMerchandiseById(id);

        if (merch == null)
        {
            _logger.LogWarning("Merchandise not found for ID: {id}", id);
            return NotFound(new { message = $"Merchandise with ID {id} not found." });
        }

        _logger.LogInformation("Returning merchandise with ID: {id}", id);
        return Ok(merch);
    }

    [HttpGet("size/{size}")]
    public IActionResult GetMerchandiseBySize(string size)
    {
        _logger.LogInformation("GetMerchandiseBySize endpoint called with size: {Size}", size);

        var merchList = _merchandiseService.GetMerchandiseBySize(size);

        if (merchList.Count == 0)
        {
            _logger.LogWarning("No merchandise found for size: {size}", size);
            return NotFound(new { message = $"No merchandise found for size: {size}", size });
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
            _logger.LogWarning("No merchandise found for category: {category}", category);
            return NotFound(new { message = $"No merchandise found for category: {category}", category });
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
            return BadRequest(ModelState); // Keep returning ModelState for detailed error info
        }

        var insertMerchResult = _merchandiseService.InsertMerchandise(merchandiseCreateDto);

        switch (insertMerchResult)
        {
            case InsertResult.Success:
                _logger.LogInformation("Merchandise inserted successfully: {Merchandise}", merchandiseCreateDto);
                return Ok(new { message = "Merchandise inserted successfully." });
            case InsertResult.AlreadyExists:
                _logger.LogWarning("Merchandise already exists: {Merchandise}", merchandiseCreateDto);
                return Conflict(new { message = $"Merchandise {merchandiseCreateDto.Name} already exists." });
            case InsertResult.Error:
            default:
                _logger.LogError("Internal server error while inserting merchandise: {Merchandise}",
                    merchandiseCreateDto);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Internal server error during merchandise insert." });
        }
    }

    //[Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public IActionResult DeleteMerchandiseById(int id)
    {
        _logger.LogInformation("DeleteMerchandiseById endpoint called for ID: {Id}", id);

        var isDeleted = _merchandiseService.DeleteMerchandiseById(id);

        switch (isDeleted)
        {
            case true:
                _logger.LogInformation("Merchandise deleted successfully with ID: {Id}", id);
                return NoContent();
            case false:
                _logger.LogWarning("Merchandise not found with ID: {Id}", id);
                return NotFound(new { message = $"Merchandise with ID {id} not found." });
        }
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
            return BadRequest(new { message = "Invalid update values provided." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating merchandise: {Merchandise}", merchandiseUpdateDto);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Internal server error during merchandise update." });
        }
    }

    [HttpGet("sizes/{categoryId:int}")]
    public IActionResult GetSizesByCategoryId(int categoryId)
    {
        _logger.LogInformation("GetSizesByCategoryId endpoint called with categoryId: {categoryId}", categoryId);

        var sizes = _merchandiseService.GetSizesByCategoryId(categoryId);

        if (sizes != null && sizes.Count != 0) return Ok(sizes);

        _logger.LogWarning("No sizes found for categoryId: {categoryId}", categoryId);
        return NotFound(new { message = $"No sizes found for category ID: {categoryId}." });
    }

    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        _logger.LogInformation("GetCategories endpoint called");

        var categories = _merchandiseService.GetCategories();
        if (categories.Count != 0) return Ok(categories);
        _logger.LogWarning("No categories found.");
        return NotFound(new { message = "No categories found." });
    }

    [HttpGet("themes")]
    public IActionResult GetThemes()
    {
        _logger.LogInformation("GetThemes endpoint called");

        var themes = _merchandiseService.GetThemes();
        if (themes.Count != 0) return Ok(themes);
        _logger.LogWarning("No themes found.");
        return NotFound(new { message = "No themes found." });
    }

    [HttpGet("brands")]
    public IActionResult GetBrands()
    {
        _logger.LogInformation("GetBrands endpoint called");

        var brands = _merchandiseService.GetBrands();

        if (brands.Count != 0) return Ok(brands);
        _logger.LogWarning("No brands found.");
        return NotFound(new { message = "No brands found." });
    }

    //[Authorize(Roles = "Admin")]
    [HttpPost("categories")]
    public IActionResult AddCategoryToDb([FromBody] CategoryCreateDto categoryCreateDto)
    {
        _logger.LogInformation("AddCategoryToDb endpoint called with data: {}", categoryCreateDto.Name);

        if (string.IsNullOrWhiteSpace(categoryCreateDto.Name) || !ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var insertCategoryResult = _merchandiseService.AddCategoryToDb(categoryCreateDto);


        switch (insertCategoryResult)
        {
            case InsertResult.Success:
                _logger.LogInformation("Category inserted successfully: {}", categoryCreateDto.Name);
                return Ok(new { message = "Category inserted successfully." });
            case InsertResult.AlreadyExists:
                _logger.LogWarning("Category already exists: {}", categoryCreateDto.Name);
                return Conflict(new { message = $"Category {categoryCreateDto.Name} already exists." });
            case InsertResult.Error:
            default:
                _logger.LogError("Internal server error while inserting category: {}", categoryCreateDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Internal server error during category insert." });
        }
    }

    //[Authorize(Roles = "Admin")]
    [HttpPost("themes")]
    public IActionResult AddThemeToDb([FromBody] ThemeCreateDto themeCreateDto)
    {
        _logger.LogInformation("AddThemeToDb endpoint called with data: {}", themeCreateDto.Name);

        if (string.IsNullOrWhiteSpace(themeCreateDto.Name) || !ModelState.IsValid)
        {
            return BadRequest(ModelState); // Return BadRequest with ModelState
        }

        var insertThemeResult = _merchandiseService.AddThemeToDb(themeCreateDto);

        switch (insertThemeResult)
        {
            case InsertResult.Success:
                _logger.LogInformation("Theme inserted successfully: {}", themeCreateDto.Name);
                return Ok(new { message = "Theme inserted successfully." });
            case InsertResult.AlreadyExists:
                _logger.LogWarning("Theme already exists: {}", themeCreateDto.Name);
                return Conflict(
                    new { message = $"Theme {themeCreateDto.Name} already exists in the database." });
            case InsertResult.Error:
            default:
                _logger.LogError("Internal server error while inserting theme: {}", themeCreateDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Theme insert was unsuccessful due to internal server error." });
        }
    }
}