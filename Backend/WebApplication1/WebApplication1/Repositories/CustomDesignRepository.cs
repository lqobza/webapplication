using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class CustomDesignRepository : ICustomDesignRepository
{
    
    private readonly IDatabaseWrapper _db;

    
    public CustomDesignRepository(IDatabaseWrapper databaseWrapper)
    {
        _db = databaseWrapper;
    }

    public Task<int> CreateDesignAsync(CustomDesignCreateDto design)
    {
        const string query= @"
            INSERT INTO CustomDesigns (user_id, name, front_image, back_image, created_at)
            OUTPUT INSERTED.ID
            VALUES (@userId, @name, @frontImage, @backImage, GETDATE())";
        

        var parameters = new[]
        {
            new SqlParameter("@userId", design.UserId),
            new SqlParameter("@name", design.Name),
            new SqlParameter("@frontImage",design.FrontImage),
            new SqlParameter("@backImage", design.BackImage)
        };

        var result = _db.ExecuteScalar(query, parameters);
        
        if (result == null) 
            throw new InvalidOperationException("Failed to get the inserted design ID"); 
        
        return Task.FromResult(Convert.ToInt32(result));
    }
    

    public Task<List<CustomDesignDto>> GetDesignsByUserIdAsync(string userId)
    {
        const string query = @"SELECT * FROM CustomDesigns WHERE user_id = @userId ORDER BY created_at DESC";
        var parameters = new[]
        {
            new SqlParameter("@userId", userId)
        };

        var designList = new List<CustomDesignDto>();
        using var reader = _db.ExecuteReader(query, parameters);

        while (reader.Read())
        {
            var design = new CustomDesignDto
            {
                Id = (int)reader["id"],
                UserId = (string)reader["user_id"],
                Name = (string)reader["name"],
                FrontImage =(string)reader["front_image"],
                BackImage = (string)reader["back_image"],
                CreatedAt = (DateTime)reader["created_at"]
            };
            designList.Add(design);
        }

        return Task.FromResult(designList);
        
    }

    public Task<CustomDesignDto?> GetDesignByIdAsync(int id)
    {
        const string query = @"SELECT * FROM CustomDesigns WHERE id = @id";
        var parameters = new[]
        {
            new SqlParameter("@id", id)
        };

        using var reader = _db.ExecuteReader(query, parameters);

        if (reader.Read())
            return Task.FromResult(new CustomDesignDto
            {
                Id = (int)reader["id"],
                UserId = (string)reader["user_id"], 
                Name = (string)reader["name"],
                FrontImage = (string)reader["front_image"],
                BackImage = (string)reader["back_image"],
                CreatedAt = (DateTime)reader["created_at"]
            })!;

        return Task.FromResult<CustomDesignDto?>(null);
    }

    public Task DeleteDesignAsync(int id)
    {
        const string query=@"DELETE FROM CustomDesigns WHERE id = @id";
        var parameters = new[]
        {
            new SqlParameter("@id",id)
        };

        _db.ExecuteNonQuery(query, parameters);
        return Task.CompletedTask;
    }
    
    
}