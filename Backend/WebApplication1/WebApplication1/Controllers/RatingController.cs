using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.DTOs;
using WebApplication1.Services.Interface;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RatingController : ControllerBase
{
    private readonly ILogger<RatingController> _logger;
    private readonly IRatingService _ratingService;

    public RatingController(IRatingService ratingService, ILogger<RatingController> logger)
    {
        _ratingService = ratingService;
        _logger = logger;
    }

    [HttpPost("")]
    [Authorize(Roles = "Admin,User")]
    public IActionResult AddRating([FromBody] RatingCreateDto ratingCreateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _logger.LogInformation("AddRating endpoint called with data: {Rating}", ratingCreateDto);
        try
        {
            var result = _ratingService.AddRating(ratingCreateDto);
            if (result)
                return Ok(new { message = "Rating added successfully." });

            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while adding the rating." });
        }
        catch (ArgumentException)
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