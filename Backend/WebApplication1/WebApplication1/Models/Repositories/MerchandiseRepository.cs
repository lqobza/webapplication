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
            using (SqlConnection dbConnection = new SqlConnection(connectionString))
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
            using (SqlConnection connection = new SqlConnection(connectionString))
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
            using (SqlCommand command = new SqlCommand(query))
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

    public List<MerchandiseDto> GetAllMerchandise()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var merchList = new List<MerchandiseDto>();

        using (SqlConnection dbConnection = new SqlConnection(connectionString))
        {
            dbConnection.Open();
            string query = @"
                SELECT m.id, m.category, m.name, m.instock, m.price, m.description, m.rating, m.size, m.brand, b.name as brandName
                FROM Merch m
                INNER JOIN Brand b ON m.brand = b.id";
            SqlCommand command = new SqlCommand(query, dbConnection);
            SqlDataReader reader = command.ExecuteReader();

            while (reader.Read())
            {
                MerchandiseDto merchandise = new MerchandiseDto()
                {
                    Id = (int)reader["id"],
                    CategoryId = (int)reader["category"],
                    Name = (string)reader["name"],
                    InStock = (int)reader["instock"],
                    Price = (int)reader["price"],
                    Description = (string)reader["description"],
                    Rating = reader["rating"] != DBNull.Value ? (int)reader["rating"] : 0,
                    Size = (string)reader["size"],
                    BrandId = (int)reader["brand"],
                    BrandName = (string)reader["brandName"]
                };
                merchList.Add(merchandise);
            }

            reader.Close();
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
            using (SqlConnection dbConnection = new SqlConnection(connectionString))
            {
                dbConnection.Open();
                string query = "SELECT * FROM Merch WHERE size = @size";
                using (SqlCommand command = new SqlCommand(query, dbConnection))
                {
                    command.Parameters.Add(new SqlParameter("@size", SqlDbType.NVarChar, 255) { Value = size });
                    SqlDataReader reader = command.ExecuteReader();
                
                    while (reader.Read())
                    {
                        MerchandiseDto merchandise = new MerchandiseDto()
                        {
                            Id = (int)reader["id"],
                            CategoryId = (int)reader["category"],
                            Name = (string)reader["name"],
                            InStock = (int)reader["instock"],
                            Price = (int)reader["price"],
                            Description = (string)reader["description"],
                            Rating = (int)reader["rating"],
                            Size = (string)reader["size"],
                            BrandId = (int)reader["brand"]
                        };
                        merchList.Add(merchandise);
                    }
                    reader.Close();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching merchandise by size");
            throw new Exception("An error occurred while fetching merchandise", ex); // Optional: throw a custom exception
        }

        return merchList;
    }

    public InsertMerchResult InsertMerch(MerchandiseDto merchandise)
    {
        try
        {
            var insertCommandText = "INSERT INTO Merch (category, name, instock, price, description, rating, size, brand) " +
                                    "VALUES (@category, @name, @instock, @price, @description, @rating, @size, @brand);";

            using (SqlCommand insertCommand = new SqlCommand(insertCommandText))
            {
                insertCommand.Parameters.Add("category", SqlDbType.Int).Value = merchandise.CategoryId;
                insertCommand.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = merchandise.Name;
                insertCommand.Parameters.Add("instock", SqlDbType.Int).Value = merchandise.InStock;
                insertCommand.Parameters.Add("price", SqlDbType.Int).Value = merchandise.Price;
                insertCommand.Parameters.Add("description", SqlDbType.NVarChar, 255).Value = merchandise.Description;
                insertCommand.Parameters.Add("rating", SqlDbType.Int).Value = merchandise.Rating.HasValue ? merchandise.Rating.Value : DBNull.Value;
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
        var deleteMerchThemeCommandText = "DELETE FROM MerchTheme WHERE merchid = @id;";
        var deleteMerchCommandText = "DELETE FROM Merch WHERE ID = @id;";

        using (SqlCommand deleteMerchThemeCommand = new SqlCommand(deleteMerchThemeCommandText))
        {
            deleteMerchThemeCommand.Parameters.Add("id", SqlDbType.Int).Value = id;
            if (ExecuteNonQuery(deleteMerchThemeCommand) > 0)
            {
                Console.WriteLine("MerchTheme was deleted successfully");
            }
        }
        
        using (SqlCommand deleteMerchCommand = new SqlCommand(deleteMerchCommandText))
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
                updateFields.Add("instock = @InStock");
                command.Parameters.AddWithValue("@InStock", merchandiseUpdateDto.InStock.Value);
            }
            if (merchandiseUpdateDto.Price.HasValue)
            {
                updateFields.Add("price = @Price");
                command.Parameters.AddWithValue("@Price", merchandiseUpdateDto.Price.Value);
            }
            if (!string.IsNullOrEmpty(merchandiseUpdateDto.Description))
            {
                updateFields.Add("description = @Description");
                command.Parameters.AddWithValue("@Description", merchandiseUpdateDto.Description);
            }
            if (merchandiseUpdateDto.Rating.HasValue)
            {
                updateFields.Add("rating = @Rating");
                command.Parameters.AddWithValue("@Rating", merchandiseUpdateDto.Rating.Value);
            }

            if (!updateFields.Any())
            {
                throw new ArgumentException("No fields to update.");
            }

            var updateQuery = $"UPDATE Merch SET {string.Join(", ", updateFields)} WHERE id = @Id";
            command.CommandText = updateQuery;
            command.Parameters.AddWithValue("@Id", id);

            command.Connection = connection;
            connection.Open();
            var rowsAffected = command.ExecuteNonQuery();
            return rowsAffected > 0;
        }
    }
}