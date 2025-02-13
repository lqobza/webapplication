using WebApplication1.Models.DTOs;

namespace WebApplication1.Services.Interface;

public interface IAuthService
{
    Task<string> RegisterUserAsync(RegisterDto registerDto);
    Task<string> LoginAsync(LoginDto loginDto);
} 