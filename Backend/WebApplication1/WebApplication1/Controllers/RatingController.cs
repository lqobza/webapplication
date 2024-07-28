using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using WebApplication1.Models.Repositories;
using WebApplication1.Models.Services;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RatingController : ControllerBase
{
    private readonly IRatingService _ratingService;
    private readonly ILogger<RatingController> _logger;

    public RatingController(IRatingService ratingService, ILogger<RatingController> logger)
    {
        _ratingService = ratingService;
        _logger = logger;
    }

    [HttpPost("addRating")]
    public IActionResult AddRating([FromBody] RatingCreateDto ratingCreateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        _logger.LogInformation("AddRating endpoint called with data: {Rating}", ratingCreateDto);
        try
        {
            var result = _ratingService.AddRating(ratingCreateDto);
            if (result)
            {
                return Ok(new { message = "Rating added successfully." });
            }
            else
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "An error occurred while adding the rating." });
            }
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Merchandise not found with id: {Id}", ratingCreateDto.MerchId);
            return StatusCode(StatusCodes.Status400BadRequest);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("An error occurred while adding the rating. {ex}", ex);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}