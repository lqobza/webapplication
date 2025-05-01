using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Services.Interface;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchandiseController : ControllerBase
{
    private readonly ILogger<MerchandiseController> _logger;
    private readonly IMerchandiseService _merchandiseService;
    private readonly IImageStorageService _imageStorageService; 
    private readonly IMerchandiseRepository _merchandiseRepository;

    public MerchandiseController(IMerchandiseService merchandiseService, ILogger<MerchandiseController> logger,
        IImageStorageService imageStorageService, IMerchandiseRepository merchandiseRepository)
    {
        _merchandiseService = merchandiseService;
        _logger = logger;
        _imageStorageService = imageStorageService;
        _merchandiseRepository = merchandiseRepository;
    }

    [HttpGet]
    public IActionResult GetAllMerchandise([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("GetAllMerchandise endpoint called with page {Page} pageSize: {PageSize}",page,pageSize);

        if (page < 1 || pageSize < 1) 
            return BadRequest(new { message ="Page and pageSize must be more than 0"});

        var result = _merchandiseService.GetAllMerchandise(page, pageSize);
        
        if (result.Items.Count==0){
            _logger.LogWarning("No merchandise found");
            return NotFound(new { message = "No merchandise found"});
        }

        _logger.LogInformation("Returning merchandise list, count: {Count} total: {Total})",result.Items.Count, result.TotalCount);
        
        return Ok(result);
    }

    
    [HttpGet("search")]
    public IActionResult SearchMerchandise([FromQuery] MerchandiseSearchDto searchParams)
    {
        _logger.LogInformation("SearchMerchandise endpoint called with params {@SearchParams}", searchParams);

        if (searchParams.Page < 1 ||searchParams.PageSize < 1)
            return BadRequest(new { message="Page and pageSize must be greater than 0"});
        if (searchParams is { MinPrice: not null, MaxPrice: not null } &&
            searchParams.MinPrice > searchParams.MaxPrice)
            return BadRequest(new { message= "MinPrice cannot be greater than MaxPrice"});

        var result = _merchandiseService.SearchMerchandise(searchParams);
        if (result.Items.Count == 0)
        {
            _logger.LogWarning("No merchandise found for search criteria");
            return NotFound(new { message = "No merchandise found for the given search criteria"}); 
        }

        _logger.LogInformation("Returning search results, count: {Count}, total: {Total}",result.Items.Count, result.TotalCount);
        return Ok(result);
    }

    
    [HttpGet("{id:int}")]
    public IActionResult GetMerchandiseById(int id)
    {
        _logger.LogInformation("GetMerchandiseById endpoint called with id: {id}", id);

        var merch = _merchandiseService.GetMerchandiseById(id);

        if (merch == null)
        {
            _logger.LogWarning("Merchandise not found for ID: {id}", id);
            return NotFound(new { message = $"Merchandise with ID {id} not found" });
        }

        _logger.LogInformation("Returning merchandise with ID: {id}", id);
        return Ok(merch);
    }

    [HttpGet("size/{size}")]
    public IActionResult GetMerchandiseBySize(string size)
    {
        if (string.IsNullOrWhiteSpace(size)) return BadRequest(new { message = "Size cannot be empty" });

        size = size.Trim().ToUpper();

        _logger.LogInformation("GetMerchandiseBySize endpoint called with size: {Size}", size);

        var merchList = _merchandiseService.GetMerchandiseBySize(size);
        if (merchList.Count == 0) {
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

        if (merchList.Count == 0) {
            _logger.LogWarning("No merchandise found for category: {category}", category);
            return NotFound(new { message = $"No merchandise found for category: {category}", category });
        }

        _logger.LogInformation("Returning merchandise list for category: {category}", category);
        return Ok(merchList);
    }

    [HttpPost("")]
    [Authorize(Roles = "Admin")]
    public IActionResult InsertMerchandise([FromBody] MerchandiseCreateDto merchandiseCreateDto)
    {
        _logger.LogInformation("InsertMerchandise endpoint called with merch {Merchandise}", merchandiseCreateDto);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid input data");
            return BadRequest(ModelState);
        }

        try
        {
            var insertMerchResult = _merchandiseService.InsertMerchandise(merchandiseCreateDto);

            switch (insertMerchResult)
            {
                case InsertResult.Success:
                    _logger.LogInformation("Merchandise inserted successfully: {Merchandise}", merchandiseCreateDto);
                    return Ok(new { message = "Merchandise inserted successfully" });
                
                case InsertResult.AlreadyExists:
                    _logger.LogWarning("Merchandise already exists: {Merchandise}", merchandiseCreateDto);
                    return Conflict(new { message = $"Merchandise {merchandiseCreateDto.Name} already exists" });
                
                case InsertResult.Error:
                default:
                    _logger.LogError("Internal server error while inserting merchandise: {Merchandise}",
                        merchandiseCreateDto);
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new{ message = "Internal server error during merchandise insert." });
            }
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while inserting merchandise: {Merchandise}", merchandiseCreateDto);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = $"Exception during merchandise insert: {ex.Message}", stackTrace = ex.StackTrace });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public IActionResult DeleteMerchandiseById(int id)
    {
        _logger.LogInformation("DeleteMerchandiseById endpoint called for Id {Id}", id);

        var isDeleted = _merchandiseService.DeleteMerchandiseById(id);

        switch (isDeleted)
        {
            case true:
                _logger.LogInformation("Merchandise deleted successfully with ID: {Id}", id);
                return Ok();
            case false:
                _logger.LogWarning("Merchandise not found with ID: {Id}", id);
                return NotFound(new { message = $"Merchandise with ID {id} not found" });
        }
    }

    [HttpPatch("{id:int}")]
    [Authorize(Roles = "Admin")]
    public IActionResult UpdateMerchandise(int id, [FromBody] MerchandiseUpdateDto merchandiseUpdateDto)
    {
        if (id <= 0) return BadRequest(new { message = "Invalid merchandise ID" });

        _logger.LogInformation("UpdateMerchandise endpoint called with data: {Merchandise}", merchandiseUpdateDto);

        try
        {
            if (!_merchandiseService.MerchandiseExists(id))
            {
                _logger.LogWarning("Merchandise with ID {Id} not found", id);
                return NotFound(new { message = $"Merchandise with ID {id} not found" });
            }

            if (merchandiseUpdateDto.Sizes != null)
                foreach (var size in merchandiseUpdateDto.Sizes)  {
                    if (size.InStock < 0) return BadRequest(new { message = "InStock value cannot be negative." });

                    if (string.IsNullOrWhiteSpace(size.Size))
                        return BadRequest(new { message = "Size name cannot be empty" });
                }

            var result = _merchandiseService.UpdateMerchandise(id, merchandiseUpdateDto);
            if (result)
            {
                _logger.LogInformation("Merchandise updated successfully: {Merchandise}", merchandiseUpdateDto);
                return Ok(new { message = "Merchandise updated successfully" });
            }

            _logger.LogWarning("Merchandise not found or no fields updated: {Merchandise}", merchandiseUpdateDto);
            return NotFound(new { message = "Merchandise not found or no fields updated" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Error in request input: {Merchandise}", merchandiseUpdateDto);
            return BadRequest(new { message = "Invalid update values provided" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating merchandise: {Merchandise}", merchandiseUpdateDto);
            return StatusCode(500, new { message = "An error occurred while updating merchandise" });
        }
    }

    
    [HttpGet("sizes/{categoryId:int}")]
    public IActionResult GetSizesByCategoryId(int categoryId)
    {
        _logger.LogInformation("GetSizesByCategoryId endpoint called with categoryId: {categoryId}", categoryId);

        var sizes = _merchandiseService.GetSizesByCategoryId(categoryId);

        if (sizes != null && sizes.Count != 0) return Ok(sizes);

        _logger.LogWarning("No sizes found for categoryId: {categoryId}", categoryId);
        return NotFound(new { message = $"No sizes found for category ID: {categoryId}" });
    }

    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        _logger.LogInformation("GetCategories endpoint called");

        var categories = _merchandiseService.GetCategories();
        if (categories.Count != 0) 
            return Ok(categories);
        
        _logger.LogWarning("No categories found");
        
        return NotFound(new{message = "No categories found" });
    }

    [HttpGet("themes")]
    public IActionResult GetThemes()
    {
        _logger.LogInformation("GetThemes endpoint called");

        var themes = _merchandiseService.GetThemes();
        if (themes.Count != 0) 
            return Ok(themes);
        
        _logger.LogWarning("No themes found");
        return NotFound(new { message = "No themes found" });
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

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public IActionResult AddCategoryToDb([FromBody] CategoryCreateDto categoryCreateDto)
    {
        _logger.LogInformation("AddCategoryToDb endpoint called with data {Name}", categoryCreateDto.Name);

        if (string.IsNullOrWhiteSpace(categoryCreateDto.Name) || !ModelState.IsValid) return BadRequest(ModelState);

        var insertCategoryResult = _merchandiseService.AddCategoryToDb(categoryCreateDto);


        switch (insertCategoryResult)
        {
            case InsertResult.Success:
                _logger.LogInformation("Category inserted successfully {Name}", categoryCreateDto.Name);
                return Ok(new { message = "Category inserted successfully"});
            case InsertResult.AlreadyExists:
                _logger.LogWarning("Category already exists: {Name}", categoryCreateDto.Name);
                return Conflict(new { message = $"Category {categoryCreateDto.Name} already exists"});
            case InsertResult.Error:
            default:
                _logger.LogError("Internal server error while inserting category {Name}", categoryCreateDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Internal server error during category insert" });
        }
        
    }

    [HttpPost("themes")]
    [Authorize(Roles = "Admin")]
    public IActionResult AddThemeToDb([FromBody] ThemeCreateDto themeCreateDto)
    {
        _logger.LogInformation("AddThemeToDb endpoint called with data {Name}", themeCreateDto.Name);

        if (string.IsNullOrWhiteSpace(themeCreateDto.Name) || !ModelState.IsValid) return BadRequest(ModelState);

        var insertThemeResult = _merchandiseService.AddThemeToDb(themeCreateDto);

        switch (insertThemeResult)
        {
            case InsertResult.Success:
                _logger.LogInformation("Theme inserted successfully {Name}", themeCreateDto.Name);
                return Ok(new {message="Theme inserted successfully"});
            
            case InsertResult.AlreadyExists:
                _logger.LogWarning("Theme already exists {Name}", themeCreateDto.Name);
                return Conflict(new{ message = $"Theme {themeCreateDto.Name} already exists in the database" });
            case InsertResult.Error:
            default:
                _logger.LogError("Internal server error while inserting theme: {}", themeCreateDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new {message="Internal server error"});
        }
    }

    [HttpPost("{id:int}/images")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage(int id, IFormFile image)
    {
        if (image.Length == 0)
            return BadRequest("No image file provided");

        _logger.LogInformation("Uploading image for merchandise {id}", id);

        try
        {
            var result = await _merchandiseService.UploadMerchandiseImage(id, image);
            _logger.LogInformation("Image uploaded successfully for merchandise {id}, image ID: {ResultId}", id, result.Id);

            return Ok(new { imageUrl = result.ImageUrl });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex.Message);
            return NotFound(ex.Message);
        }
        
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex.Message);
            return BadRequest(ex.Message);
        }
        
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error uploading image for merchandise {Id}", id);
            return BadRequest($"Cannot add image to merchandise (ID: {id}): {ex.InnerException?.Message}");
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for merchandise {Id}", id);
            return StatusCode(500, "Error uploading image");
        }
        
    }

    [HttpGet("images/{merchandiseId:int}")]
    public IActionResult GetMerchandiseImages(int merchandiseId)
    {
        _logger.LogInformation("GetMerchandiseImages endpoint called for merchandiseId: {merchandiseId}",
            merchandiseId);

        if (!_merchandiseService.MerchandiseExists(merchandiseId))
        {
            _logger.LogWarning("Merchandise not found with ID: {Id}", merchandiseId);
            return NotFound(new { message = $"Merchandise with ID {merchandiseId} not found" });
        }

        var images = _merchandiseService.GetMerchandiseImages(merchandiseId);

        if (images.Count==0)
        {
            _logger.LogWarning("No images found for merchandise ID: {Id}", merchandiseId);
            return NotFound(new { message = $"No images found for merchandise with ID {merchandiseId}" });
        }

        _logger.LogInformation("Returning {Count} images for merchandise ID: {Id}", images.Count, merchandiseId);
        return Ok(images);
    }

    [HttpGet("image/{merchandiseId:int}/{fileName}")]
    public IActionResult GetImage(int merchandiseId, string fileName)
    {
        var imagePath = Path.Combine(_imageStorageService.GetImageDirectory(), merchandiseId.ToString(), fileName);

        if (!System.IO.File.Exists(imagePath)) 
             return NotFound();

        var imageFileStream = System.IO.File.OpenRead(imagePath);
        return File(imageFileStream, "image/jpeg");
    }

    [HttpDelete("image/{merchandiseId:int}/{fileName}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteImage(int merchandiseId, string fileName)
    {
        _logger.LogInformation("DeleteImage endpoint called for merchandise ID: {Id}, filename: {FileName}",
            merchandiseId, fileName);

        try
        {
            var result = await _merchandiseService.DeleteMerchandiseImage(merchandiseId, fileName);

            if (!result)
            {
                _logger.LogWarning("Image with filename {FileName} for Merchandise {Id} not found", fileName,
                    merchandiseId);
                return NotFound();
            }

            _logger.LogInformation("Image with filename {FileName} for Merchandise {Id} deleted successfully", fileName,
                merchandiseId); 
            
            return Ok();
            
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image for merchandise ID: {Id}, filename: {FileName}",
                merchandiseId, fileName);
            return StatusCode(500, new { message = "An error occurred while deleting the image" });
        }
    }
    

    [HttpGet("{id:int}/stock/{size}")]
    public IActionResult CheckStockAvailability(int id, string size, [FromQuery] int quantity = 1)
    {
        _logger.LogInformation(
            "CheckStockAvailability endpoint called for merchandise ID: {Id}, size: {Size}, quantity: {Quantity}",
            id, size, quantity);

        try
        {
            var merchandise = _merchandiseService.GetMerchandiseById(id);
            if (merchandise == null)
            {
                _logger.LogWarning("Merchandise with ID {Id} not found", id);
                return NotFound(new { message = $"Merchandise with ID {id} not found" });
            }

            var merchandiseName = merchandise.Name;

            var sizes = _merchandiseService.GetSizesByCategoryId(merchandise.CategoryId);
            if (sizes == null || !sizes.Contains(size))
            {
                _logger.LogWarning("Size {Size} not available for merchandise ID {Id}", size, id);
                return NotFound(new { message = $"Size {size} not available for merchandise with ID {id}" });
            }

            var merchSizes = _merchandiseRepository.GetSizesByMerchId(id);
            var sizeInfo = merchSizes.FirstOrDefault(s => s.Size == size);

            if (sizeInfo == null)
            {
                _logger.LogWarning("Size {Size} not found in stock for merchandise ID {Id}", size, id);
                return NotFound(new { message = $"Size {size} not found in stock for merchandise with ID {id}" });
            }

            var isAvailable = sizeInfo.InStock >= quantity;

            _logger.LogInformation(
                "Stock check for {MerchandiseName} (ID: {Id}, Size: {Size}): Available: {Available}, Requested: {Requested}",
                merchandiseName, id, size, sizeInfo.InStock, quantity);

            return Ok(new {
                    isAvailable,
                    available = sizeInfo.InStock,
                    requested = quantity,
                    merchandiseName,
                    size
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking stock availability for merchandise ID: {Id}, size: {Size}", id, size);
            return StatusCode(500, new { message = "An error occurred while checking stock availability" });
        }
    }
    
    
}
