using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Repositories;

public class MerchandiseRepository : BaseRepository, IMerchandiseRepository
{
    private IConfiguration _configuration;
    private readonly ILogger<MerchandiseRepository> _logger;
    private readonly IRatingRepository _ratingRepository;

    public MerchandiseRepository(IConfiguration configuration, ILogger<MerchandiseRepository> logger, IRatingRepository ratingRepository)
        : base(configuration)
    {
        _configuration = configuration;
        _logger = logger;
        _ratingRepository = ratingRepository;
    }

    private int ExecuteNonQuery(SqlCommand dbCommand)
    {
        using (var connection = CreateConnection())
        {
            dbCommand.Connection = connection;
            connection.Open();

            using (var dbTransaction = connection.BeginTransaction())
            {
                try
                {
                    dbCommand.Transaction = dbTransaction;
                    var rowsAffected = dbCommand.ExecuteNonQuery();
                    dbTransaction.Commit();
                    return rowsAffected;
                }
                catch (SqlException ex)
                {
                    _logger.LogError(ex, "A database error occurred while executing non-query.");
                    dbTransaction.Rollback();
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An unexpected error occurred while executing non-query.");
                    throw;
                }
            }
        }
    }
    
    private int ExecuteScalar(SqlCommand command)
    {
        using (var connection = CreateConnection())
        {
            command.Connection = connection;
            connection.Open();
            return (int)command.ExecuteScalar();
        }
        /*catch (SqlException ex)
        {
            _logger.LogError(ex, "Database error occurred while executing scalar query.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while executing scalar query.");
            throw;
        }*/
    }
    
    public bool Exists(int categoryId, string name, int brandId)
    {
        var query = "SELECT COUNT(*) FROM Merch WHERE category = @category AND name = @name AND brand = @brand;";
        using (var command = new SqlCommand(query))
        {
            command.Parameters.Add("category", SqlDbType.Int).Value = categoryId;
            command.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = name;
            command.Parameters.Add("brand", SqlDbType.Int).Value = brandId;

            int count = ExecuteScalar(command);
            return count > 0;
        }
    }

    public List<MerchandiseDto> GetAllMerchandise()
    {
        var query = @"
                SELECT m.*, b.name as BrandName
                FROM Merch m
                JOIN Brand b ON m.brand = b.id";
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            using (var reader = command.ExecuteReader())
            {
                var merchList = new List<MerchandiseDto>();
                while (reader.Read())
                {
                    var merchandise = new MerchandiseDto
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

                foreach (var merchandise in merchList)
                {
                    merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
                }
                return merchList;
            }
        }
    }
    
    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        var query = @"
                SELECT m.*, b.name as BrandName
                FROM Merch m
                JOIN Brand b ON m.brand = b.id
                WHERE size = @size";
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@size", SqlDbType.NVarChar, 255) { Value = size });
                using (var reader = command.ExecuteReader())
                {
                    var merchList = new List<MerchandiseDto>();
                    while (reader.Read())
                    {
                        var merchandise = new MerchandiseDto
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

                    foreach (var merchandise in merchList)
                    {
                        merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
                    }
                    return merchList;
                }
            }
        }
    }
    
    public List<MerchandiseDto> GetMerchandiseByCategory(int category)
    {
        var query = @"
                SELECT m.*, b.name as BrandName
                FROM Merch m
                JOIN Brand b ON m.brand = b.id
                WHERE category = @category";
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@category", SqlDbType.Int) { Value = category });
                using (var reader = command.ExecuteReader())
                {
                    var merchList = new List<MerchandiseDto>();
                    while (reader.Read())
                    {
                        var merchandise = new MerchandiseDto
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

                    foreach (var merchandise in merchList)
                    {
                        merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
                    }
                    return merchList;
                }
            }
        }
    }

    public InsertMerchResult InsertMerch(MerchandiseDto merchandise)
    {
        var insertCommandText = "INSERT INTO Merch (category, name, instock, price, description, size, brand) " +
                                "VALUES (@category, @name, @instock, @price, @description, @size, @brand);";

        using (var insertCommand = new SqlCommand(insertCommandText))
        {
            insertCommand.Parameters.Add("category", SqlDbType.Int).Value = merchandise.CategoryId;
            insertCommand.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = merchandise.Name;
            insertCommand.Parameters.Add("instock", SqlDbType.Int).Value = merchandise.InStock;
            insertCommand.Parameters.Add("price", SqlDbType.Int).Value = merchandise.Price;
            insertCommand.Parameters.Add("description", SqlDbType.NVarChar, 255).Value = merchandise.Description;
            insertCommand.Parameters.Add("size", SqlDbType.NVarChar, 255).Value = merchandise.Size;
            insertCommand.Parameters.Add("brand", SqlDbType.Int).Value = merchandise.BrandId;

            return ExecuteNonQuery(insertCommand) == 1 ? InsertMerchResult.Success : InsertMerchResult.Error;
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
        var updateFields = new List<string>();
        var command = new SqlCommand();

        if (merchandiseUpdateDto.InStock.HasValue)
        {
            updateFields.Add("instock = @InStock");
            command.Parameters.Add("@InStock", SqlDbType.Int).Value = merchandiseUpdateDto.InStock.Value;
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

        using (var connection = CreateConnection())
        {
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