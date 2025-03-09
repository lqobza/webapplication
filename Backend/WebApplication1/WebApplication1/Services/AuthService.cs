using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Utils;
using WebApplication1.Services.Interface;

namespace WebApplication1.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public AuthService(IConfiguration configuration, ApplicationDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    public async Task<string> RegisterUserAsync(RegisterDto registerDto)
    {
        // Check if the user already exists
        var existingUser = await _context.Users.SingleOrDefaultAsync(u => u.Email == registerDto.Email);
        if (existingUser != null)
        {
            throw new ArgumentException("User already exists.");
        }

        // Generate salt and hash the password
        byte[] salt = new byte[128 / 8];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }
        var saltString = Convert.ToBase64String(salt);
        var passwordHash = HashPassword(registerDto.Password, salt);

        // Create the user
        var user = new ApplicationUser
        {
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = passwordHash,
            PasswordSalt = saltString
        };

        // Save the user to the database
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate a JWT token
        return GenerateJwtToken(user);
    }

    public async Task<string> LoginAsync(LoginDto loginDto)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == loginDto.Email);
        if (user == null)
        {
            throw new ArgumentException("Invalid email or password.");
        }

        var salt = Convert.FromBase64String(user.PasswordSalt);
        var passwordHash = HashPassword(loginDto.Password, salt);

        if (passwordHash != user.PasswordHash)
        {
            throw new ArgumentException("Invalid email or password.");
        }

        return GenerateJwtToken(user);
    }

    private string HashPassword(string password, byte[] salt)
    {
        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 10000,
            numBytesRequested: 256 / 8));

        return hashed;
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Username),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(3),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
