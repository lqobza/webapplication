using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class CustomDesignRepository : ICustomDesignRepository
{
    private readonly string? _connectionString;

    public CustomDesignRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }

    public async Task<int> CreateDesignAsync(CustomDesignCreateDto design)
    {
        var query = @"
            INSERT INTO CustomDesigns (user_id, name, front_image, back_image, created_at)
            OUTPUT INSERTED.ID
            VALUES (@userId, @name, @frontImage, @backImage, GETDATE())";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@userId", design.UserId);
        command.Parameters.AddWithValue("@name", design.Name);
        command.Parameters.AddWithValue("@frontImage", design.FrontImage);
        command.Parameters.AddWithValue("@backImage", design.BackImage);

        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        if (result == null)
        {
            throw new InvalidOperationException("Failed to get the inserted design ID");
        }
        return (int)result;
    }

    public async Task<List<CustomDesignDto>> GetDesignsByUserIdAsync(string userId)
    {
        var query = @"SELECT * FROM CustomDesigns WHERE user_id = @userId ORDER BY created_at DESC";

        var designList = new List<CustomDesignDto>();
        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@userId", userId);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var design = new CustomDesignDto
            {
                Id = (int)reader["id"],
                UserId = (string)reader["user_id"],
                Name = (string)reader["name"],
                FrontImage = (string)reader["front_image"],
                BackImage = (string)reader["back_image"],
                CreatedAt = (DateTime)reader["created_at"]
            };
            designList.Add(design);
        }

        return designList;
    }

    public async Task<CustomDesignDto?> GetDesignByIdAsync(int id)
    {
        var query = @"SELECT * FROM CustomDesigns WHERE id = @id";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@id", id);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new CustomDesignDto
            {
                Id = (int)reader["id"],
                UserId = (string)reader["user_id"],
                Name = (string)reader["name"],
                FrontImage = (string)reader["front_image"],
                BackImage = (string)reader["back_image"],
                CreatedAt = (DateTime)reader["created_at"]
            };
        }

        return null;
    }

    public async Task DeleteDesignAsync(int id)
    {
        var query = @"DELETE FROM CustomDesigns WHERE id = @id";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@id", id);

        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }
} 