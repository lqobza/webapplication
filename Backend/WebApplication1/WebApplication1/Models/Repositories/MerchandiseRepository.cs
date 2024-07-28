using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Repositories;

public class MerchandiseRepository : IMerchandiseRepository
{
    private IConfiguration _configuration;
    private readonly ILogger<MerchandiseRepository> _logger;

    public MerchandiseRepository(IConfiguration configuration, ILogger<MerchandiseRepository> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }
    
    private int ExecuteNonQuery(SqlCommand dbCommand)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        int rowsAffected;

        try
        {
            using (var dbConnection = new SqlConnection(connectionString))
            {
                dbConnection.Open();

                using (SqlTransaction dbTransaction = dbConnection.BeginTransaction())
                {
                    try
                    {
                        dbCommand.Connection = dbConnection;
                        dbCommand.Transaction = dbTransaction;

                        rowsAffected = dbCommand.ExecuteNonQuery();

                        dbTransaction.Commit();
                    }
                    catch (SqlException)
                    {
                        dbTransaction.Rollback();
                        throw; // bubble up the exception and preserve the stack trace
                    }
                }

                dbConnection.Close();
            }
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "Database error occurred while executing non-query.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while executing non-query.");
            throw;
        }

        return rowsAffected;
    }
    
    private int ExecuteScalar(SqlCommand command)
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            
            // Using statement ensures the connection is properly disposed of
            using (var connection = new SqlConnection(connectionString))
            {
                command.Connection = connection;
                connection.Open();
                
                // ExecuteScalar returns the first column of the first row in the result set
                // If no value is found, it will return null, so we cast it to an int
                // Ensure you handle potential null values appropriately
                var returnValue = (int)command.ExecuteScalar();
                
                //connection.Close();
                return returnValue;
            }
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "Database error occurred while executing scalar query.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while executing scalar query.");
            throw;
        }
    }
    
    public bool Exists(int categoryId, string name, int brandId)
    {
        var query = "SELECT COUNT(*) FROM Merch WHERE category = @category AND name = @name AND brand = @brand;";
        try
        {
            using (var command = new SqlCommand(query))
            {
                command.Parameters.Add("category", SqlDbType.Int).Value = categoryId;
                command.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = name;
                command.Parameters.Add("brand", SqlDbType.Int).Value = brandId;

                int count = ExecuteScalar(command);
                return count > 0;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while checking existence of merchandise.");
            throw; // or return a default value if appropriate
        }
    }
    
    private List<RatingDto> GetRatingsForMerchandise(int merchId, SqlConnection dbConnection) //TODO: move some things inside ratingrepository maybe?
    {
        var ratings = new List<RatingDto>();

        using (var ratingCommand = new SqlCommand("SELECT * FROM Ratings WHERE merch_id = @MerchId", dbConnection))
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

        return ratings;
    }
    
    public List<MerchandiseDto> GetAllMerchandise()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var merchList = new List<MerchandiseDto>();

        using (var dbConnection = new SqlConnection(connectionString))
        {
            dbConnection.Open();
            string query = @"
                SELECT m.*, b.name as BrandName
                FROM Merch m
                JOIN Brand b ON m.brand = b.id";
            var command = new SqlCommand(query, dbConnection);
            SqlDataReader reader = command.ExecuteReader();

            while (reader.Read())
            {
                var merchandise = new MerchandiseDto()
                {
                    Id = (int)reader["id"],
                    CategoryId = (int)reader["category"],
                    Name = (string)reader["name"],
                    InStock = (int)reader["instock"],
                    Price = (int)reader["price"],
                    Description = (string)reader["description"],
                    Size = (string)reader["size"],
                    BrandId = (int)reader["brand"],
                    BrandName = (string)reader["BrandName"],
                    Ratings = new List<RatingDto>()
                };
                merchList.Add(merchandise);
            }

            reader.Close();
            
            foreach (var merchandise in merchList)
            {
                merchandise.Ratings = GetRatingsForMerchandise(merchandise.Id, dbConnection);
            }
            dbConnection.Close();
        }

        return merchList;
    }
    
    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var merchList = new List<MerchandiseDto>();

        try
        {
            using (var dbConnection = new SqlConnection(connectionString))
            {
                dbConnection.Open();
                string query = @"
            SELECT m.*, b.name as BrandName
            FROM Merch m
            JOIN Brand b ON m.brand = b.id
            WHERE size = @size";
                using (var command = new SqlCommand(query, dbConnection))
                {
                    command.Parameters.Add(new SqlParameter("@size", SqlDbType.NVarChar, 255).Value = size);
                    SqlDataReader reader = command.ExecuteReader();
                
                    while (reader.Read())
                    {
                        var merchandise = new MerchandiseDto()
                        {
                            Id = (int)reader["id"],
                            CategoryId = (int)reader["category"],
                            Name = (string)reader["name"],
                            InStock = (int)reader["instock"],
                            Price = (int)reader["price"],
                            Description = (string)reader["description"],
                            Size = (string)reader["size"],
                            BrandId = (int)reader["brand"],
                            Ratings = new List<RatingDto>()
                        };
                        
                        merchList.Add(merchandise);
                    }
                    reader.Close();
                    
                    foreach (var merchandise in merchList)
                    {
                        merchandise.Ratings = GetRatingsForMerchandise(merchandise.Id, dbConnection);
                    }
                    dbConnection.Close();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching merchandise by size");
            throw new Exception("An error occurred while fetching merchandise", ex);
        }

        return merchList;
    }

    public InsertMerchResult InsertMerch(MerchandiseDto merchandise)
    {
        try
        {
            var insertCommandText = "INSERT INTO Merch (category, name, instock, price, description, rating, size, brand) " +
                                    "VALUES (@category, @name, @instock, @price, @description, @rating, @size, @brand);";

            using (var insertCommand = new SqlCommand(insertCommandText))
            {
                insertCommand.Parameters.Add("category", SqlDbType.Int).Value = merchandise.CategoryId;
                insertCommand.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = merchandise.Name;
                insertCommand.Parameters.Add("instock", SqlDbType.Int).Value = merchandise.InStock;
                insertCommand.Parameters.Add("price", SqlDbType.Int).Value = merchandise.Price;
                insertCommand.Parameters.Add("description", SqlDbType.NVarChar, 255).Value = merchandise.Description;
                insertCommand.Parameters.Add("size", SqlDbType.NVarChar, 255).Value = merchandise.Size;
                insertCommand.Parameters.Add("brand", SqlDbType.Int).Value = merchandise.BrandId;

                if (ExecuteNonQuery(insertCommand) == 1)
                {
                    return InsertMerchResult.Success;
                }
                else
                {
                    return InsertMerchResult.Error;
                }
            }
        }
        catch (Exception e)
        {
            //TODO log
            return InsertMerchResult.Error;
        }
    }

    public bool DeleteMerchandiseById(int id)
    {
        var deleteMerchThemeCommandText = "DELETE FROM MerchTheme WHERE merch_id = @id;";
        var deleteMerchCommandText = "DELETE FROM Merch WHERE ID = @id;";

        using (var deleteMerchThemeCommand = new SqlCommand(deleteMerchThemeCommandText))
        {
            deleteMerchThemeCommand.Parameters.Add("id", SqlDbType.Int).Value = id;
            if (ExecuteNonQuery(deleteMerchThemeCommand) > 0)
            {
                _logger.LogInformation("MerchTheme {id} was deleted successfully.", id);
            }
        }
        
        using (var deleteMerchCommand = new SqlCommand(deleteMerchCommandText))
        {
            deleteMerchCommand.Parameters.Add("id", SqlDbType.Int).Value = id;
            return ExecuteNonQuery(deleteMerchCommand) == 1;
        }
    }
    
    public bool UpdateMerch(int id, MerchandiseUpdateDto merchandiseUpdateDto)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        using (SqlConnection connection = new SqlConnection(connectionString))
        {
            var updateFields = new List<string>();
            var command = new SqlCommand();

            if (merchandiseUpdateDto.InStock.HasValue)
            {
                updateFields.Add("instock = @InStock");                                                                     //TODO: are both of these lines needed inside the ifs?
                command.Parameters.Add("@InStock", SqlDbType.Int).Value = merchandiseUpdateDto.InStock.Value;       //TODO is .Value needed?
            }
            if (merchandiseUpdateDto.Price.HasValue)
            {
                updateFields.Add("price = @Price");
                command.Parameters.Add("@Price", SqlDbType.Int).Value = merchandiseUpdateDto.Price.Value;
            }
            if (!string.IsNullOrEmpty(merchandiseUpdateDto.Description))
            {
                updateFields.Add("description = @Description");
                command.Parameters.Add("@Description", SqlDbType.VarChar, 255).Value = merchandiseUpdateDto.Description;
            }

            if (!updateFields.Any())
            {
                throw new ArgumentException("No fields to update.");
            }

            var updateQuery = $"UPDATE Merch SET {string.Join(", ", updateFields)} WHERE id = @Id";
            command.CommandText = updateQuery;
            command.Parameters.Add("@Id", SqlDbType.Int).Value = id;

            command.Connection = connection;
            connection.Open();
            var rowsAffected = command.ExecuteNonQuery();
            return rowsAffected > 0;
        }
    }
    
    /*public List<ThemeDto> GetThemesByMerchId(int merchId)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var themes = new List<ThemeDto>();

        using (SqlConnection dbConnection = new SqlConnection(connectionString))
        {
            dbConnection.Open();
            string query = @"
            SELECT t.*
            FROM Theme t
            JOIN MerchTheme mt ON t.id = mt.theme_id
            WHERE mt.merch_id = @MerchId";

            SqlCommand command = new SqlCommand(query, dbConnection);
            command.Parameters.Add("@MerchId", merchId);
            SqlDataReader reader = command.ExecuteReader();

            while (reader.Read())
            {
                ThemeDto theme = new ThemeDto
                {
                    Id = (int)reader["id"],
                    Name = (string)reader["name"]
                };
                themes.Add(theme);
            }

            reader.Close();
            dbConnection.Close();
        }

        return themes;
    }*/

}