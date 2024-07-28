using System.Data;
using System.Data.SqlClient;

namespace WebApplication1.Models.Repositories;

public class RatingRepository : IRatingRepository
{
    private IConfiguration _configuration;
    private readonly ILogger<RatingRepository> _logger;

    public RatingRepository(IConfiguration configuration, ILogger<RatingRepository> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }
    
    public bool AddRating(RatingCreateDto ratingCreateDto)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();

            // Check if the merch_id exists
            string checkMerchQuery = "SELECT COUNT(*) FROM Merch WHERE id = @MerchId";
            using (var checkCommand = new SqlCommand(checkMerchQuery, connection))
            {
                checkCommand.Parameters.Add("@MerchId", SqlDbType.Int).Value = ratingCreateDto.MerchId;
                var merchExists = (int)checkCommand.ExecuteScalar() > 0;

                if (!merchExists)
                {
                    _logger.LogWarning($"Merch ID {ratingCreateDto.MerchId} does not exist.");
                    throw new ArgumentException("Invalid Merch ID");
                }
            }

            // Insert the rating
            string query = "INSERT INTO Ratings (merch_id, rating, description) VALUES (@MerchId, @Rating, @Description)";
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add("@MerchId", SqlDbType.Int).Value = ratingCreateDto.MerchId;
                command.Parameters.Add("@Rating", SqlDbType.Int).Value = ratingCreateDto.Rating;
                command.Parameters.Add("@Description", SqlDbType.VarChar, 255).Value = !string.IsNullOrEmpty(ratingCreateDto.Description) ? ratingCreateDto.Description : DBNull.Value;

                var rowsAffected = command.ExecuteNonQuery();
                return rowsAffected > 0;
            }
        }
    }

}