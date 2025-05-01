using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.DTOs;
using WebApplication1.Services.Interface;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger; 
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        _logger.LogInformation("Registration endpoint called with {Email}", registerDto.Email);
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var token= await _authService.RegisterUserAsync(registerDto);
            _logger.LogInformation("Registration successful for: {Email}", registerDto.Email);
            return Ok(new { Token = token });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Registration failed for: {Email} {Message}",registerDto.Email, ex.Message);
            return BadRequest(new { ex.Message });
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during registration for: {Email}",
                registerDto.Email);
            return StatusCode(500, new { Message = "An error occurred while processing your request." });
        }
    }

    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        
        _logger.LogInformation("Login enfpoint called {Email}", loginDto.Email);

        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var token = await _authService.LoginAsync(loginDto);
            _logger.LogInformation("Login successful for {Email}", loginDto.Email);
            
            return Ok(new { Token = token });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Login failed for: {Email} {Message}",
                loginDto.Email, ex.Message);
            return BadRequest(new {ex.Message});
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex,"Unexpected error during login for: {Email}",
                loginDto.Email);
            return StatusCode(500, new { Message = "An error occurred while processing your request." });
        }
    }
    
}