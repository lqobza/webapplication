﻿using System.Data;
using System.Data.SqlClient;

namespace WebApplication1.Models.Repositories;

public class RatingRepository : BaseRepository, IRatingRepository
{
    private IConfiguration _configuration;
    private readonly ILogger<RatingRepository> _logger;

    public RatingRepository(IConfiguration configuration, ILogger<RatingRepository> logger)
        : base(configuration)
    {
        _configuration = configuration;
        _logger = logger;
    }
    
    public bool AddRating(RatingCreateDto ratingCreateDto)
    {
        using (var connection = CreateConnection())
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
    
    public List<RatingDto> GetRatingsForMerchandise(int merchId)
    {
        var ratings = new List<RatingDto>();

        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var ratingCommand = new SqlCommand("SELECT * FROM Ratings WHERE merch_id = @MerchId", connection))
            {
                ratingCommand.Parameters.Add("@MerchId", SqlDbType.Int).Value = merchId;
                using (SqlDataReader ratingReader = ratingCommand.ExecuteReader())
                {
                    while (ratingReader.Read())
                    {
                        var rating = new RatingDto()
                        {
                            Id = (int)ratingReader["id"],
                            MerchId = (int)ratingReader["merch_id"],
                            Rating = (int)ratingReader["rating"],
                            Description = ratingReader["description"] as string ?? string.Empty,
                            CreatedAt = (DateTime)ratingReader["created_at"]
                        };
                        ratings.Add(rating);
                    }
                }
            }
        }

        return ratings;
    }
}