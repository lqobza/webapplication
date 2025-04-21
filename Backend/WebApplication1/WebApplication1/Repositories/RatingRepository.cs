using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class RatingRepository : IRatingRepository
{
    private readonly ILogger<RatingRepository> _logger;
    private readonly IDatabaseWrapper _db;

    public RatingRepository(ILogger<RatingRepository> logger, IDatabaseWrapper databaseWrapper)
    {
        _logger = logger;
        _db = databaseWrapper;
    }

    public virtual bool AddRating(RatingCreateDto ratingCreateDto)
    {
        const string checkMerchCommand = "SELECT COUNT(*) FROM Merch WHERE id = @MerchId";
        var checkParams = new[] { new SqlParameter("@MerchId", ratingCreateDto.MerchId) };
        var merchExists = Convert.ToInt32(_db.ExecuteScalar(checkMerchCommand, checkParams)) > 0;

        if (!merchExists)
        {
            _logger.LogWarning("Merch ID {MerchId} does not exist.", ratingCreateDto.MerchId);
            throw new ArgumentException("Invalid Merch ID");
        }

        const string insertCommand =
            "INSERT INTO Ratings (merch_id, rating, description) VALUES (@MerchId, @Rating, @Description)";
        var insertParams = new[]
        {
            new SqlParameter("@MerchId", ratingCreateDto.MerchId),
            new SqlParameter("@Rating", ratingCreateDto.Rating),
            new SqlParameter("@Description", !string.IsNullOrEmpty(ratingCreateDto.Description) ? ratingCreateDto.Description : DBNull.Value)
        };

        var rowsAffected = _db.ExecuteNonQuery(insertCommand, insertParams);
        return rowsAffected > 0;
    }

    public virtual List<RatingDto> GetRatingsForMerchandise(int merchId)
    {
        var ratings = new List<RatingDto>();
        const string command = "SELECT * FROM Ratings WHERE merch_id = @MerchId";
        var parameters = new[] { new SqlParameter("@MerchId", merchId) };

        using var reader = _db.ExecuteReader(command, parameters);

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

        return ratings;
    }
}