using System.Data;
using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class RatingRepository : BaseRepository, IRatingRepository
{
    private readonly ILogger<RatingRepository> _logger;

    public RatingRepository(ILogger<RatingRepository> logger, IDatabaseWrapper databaseWrapper)
        : base(databaseWrapper)
    {
        _logger = logger;
    }

    public virtual bool AddRating(RatingCreateDto ratingCreateDto)
    {
        using var connection = CreateConnection();
        connection.Open();

        const string checkMerchCommand = "SELECT COUNT(*) FROM Merch WHERE id = @MerchId";
        using var checkCommand = new SqlCommand(checkMerchCommand, connection);

        checkCommand.Parameters.Add("@MerchId", SqlDbType.Int).Value = ratingCreateDto.MerchId;
        var merchExists = (int)checkCommand.ExecuteScalar() > 0;

        if (!merchExists)
        {
            _logger.LogWarning($"Merch ID {ratingCreateDto.MerchId} does not exist.");
            throw new ArgumentException("Invalid Merch ID");
        }

        const string insertCommand =
            "INSERT INTO Ratings (merch_id, rating, description) VALUES (@MerchId, @Rating, @Description)";
        using var command = new SqlCommand(insertCommand, connection);

        command.Parameters.Add("@MerchId", SqlDbType.Int).Value = ratingCreateDto.MerchId;
        command.Parameters.Add("@Rating", SqlDbType.Int).Value = ratingCreateDto.Rating;
        command.Parameters.Add("@Description", SqlDbType.NVarChar, 255).Value =
            !string.IsNullOrEmpty(ratingCreateDto.Description) ? ratingCreateDto.Description : DBNull.Value;

        var rowsAffected = command.ExecuteNonQuery();
        return rowsAffected > 0;
    }

    public virtual List<RatingDto> GetRatingsForMerchandise(int merchId)
    {
        var ratings = new List<RatingDto>();

        using var connection = CreateConnection();
        connection.Open();

        using var command = new SqlCommand("SELECT * FROM Ratings WHERE merch_id = @MerchId", connection);
        command.Parameters.Add("@MerchId", SqlDbType.Int).Value = merchId;

        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            var rating = new RatingDto
            {
                Id = (int)reader["id"],
                MerchId = (int)reader["merch_id"],
                Rating = (int)reader["rating"],
                Description = reader["description"] as string ?? string.Empty,
                CreatedAt = (DateTime)reader["created_at"]
            };
            ratings.Add(rating);
        }

        connection.Close();

        return ratings;
    }
}