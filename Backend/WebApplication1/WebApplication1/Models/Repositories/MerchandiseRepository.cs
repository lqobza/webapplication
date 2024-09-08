using System.Data;
using System.Data.SqlClient;
using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Repositories;

public class MerchandiseRepository : BaseRepository, IMerchandiseRepository
{
    private readonly ILogger<MerchandiseRepository> _logger;
    private readonly IRatingRepository _ratingRepository;

    public MerchandiseRepository(IConfiguration configuration, ILogger<MerchandiseRepository> logger,
        IRatingRepository ratingRepository)
        : base(configuration)
    {
        _logger = logger;
        _ratingRepository = ratingRepository;
    }

    public bool Exists(int categoryId, string name, int brandId)
    {
        var query =
            "SELECT COUNT(*) FROM Merch WHERE category_id = @categoryId AND name = @name AND brand_id = @brandId;";
        using (var command = new SqlCommand(query))
        {
            command.Parameters.Add("categoryId", SqlDbType.Int).Value = categoryId;
            command.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = name;
            command.Parameters.Add("brandId", SqlDbType.Int).Value = brandId;

            var count = ExecuteScalar(command);
            return count > 0;
        }
    }

    public List<MerchandiseDto> GetAllMerchandise()
    {
        var query = @"
            SELECT 
                m.id, 
                m.category_id, 
                c.name as CategoryName,
                m.name, 
                m.price, 
                m.description, 
                m.brand_id, 
                b.name as BrandName
            FROM 
                Merch m
            JOIN 
                Brand b ON m.brand_id = b.id
            JOIN 
                Category c ON m.category_id = c.id";

        var merchList = new List<MerchandiseDto>();
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    var merchandise = new MerchandiseDto
                    {
                        Id = (int)reader["id"],
                        CategoryId = (int)reader["category_id"],
                        CategoryName = (string)reader["CategoryName"],
                        Name = (string)reader["name"],
                        Price = (int)reader["price"],
                        Description = (string)reader["description"],
                        BrandId = (int)reader["brand_id"],
                        BrandName = (string)reader["BrandName"],
                        Ratings = new List<RatingDto>(),
                        Themes = new List<ThemeDto>(),
                        Sizes = new List<MerchSizeDto>()
                    };
                    merchList.Add(merchandise);
                }
            }
        }

        // Populate Ratings, Themes, and Sizes for each merchandise
        foreach (var merchandise in merchList)
        {
            merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
            merchandise.Themes = GetThemesByMerchId(merchandise.Id);
            merchandise.Sizes = GetSizesByMerchId(merchandise.Id, merchandise.CategoryId);
        }

        return merchList;
    }


    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        var query = @"
            SELECT 
                m.id, 
                m.category_id, 
                c.name as CategoryName,
                m.name, 
                m.price, 
                m.description, 
                m.brand_id, 
                b.name as BrandName
            FROM 
                Merch m
                JOIN 
            Brand b ON m.brand_id = b.id
            JOIN 
                Category c ON m.category_id = c.id
            WHERE m.id IN (SELECT merch_id FROM MerchSize WHERE size = @size)";

        var merchList = new List<MerchandiseDto>();
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@size", SqlDbType.NVarChar, 255) { Value = size });
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                        merchList.Add(new MerchandiseDto
                        {
                            Id = (int)reader["id"],
                            CategoryId = (int)reader["category_id"],
                            CategoryName = (string)reader["CategoryName"],
                            Name = (string)reader["name"],
                            Price = (int)reader["price"],
                            Description = (string)reader["description"],
                            BrandId = (int)reader["brand_id"],
                            BrandName = (string)reader["BrandName"],
                            Ratings = new List<RatingDto>(),
                            Themes = new List<ThemeDto>(),
                            Sizes = new List<MerchSizeDto>()
                        });
                }
            }
        }

        // Populate Ratings, Themes, and Sizes for each merchandise
        foreach (var merchandise in merchList)
        {
            merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
            merchandise.Themes = GetThemesByMerchId(merchandise.Id);
            merchandise.Sizes = GetSizesByMerchId(merchandise.Id, merchandise.CategoryId);
        }

        return merchList;
    }

    public List<MerchandiseDto> GetMerchandiseByCategory(int categoryId)
    {
        var query = @"
            SELECT 
                m.id, 
                m.category_id, 
                c.name as CategoryName,
                m.name, 
                m.price, 
                m.description, 
                m.brand_id, 
                b.name as BrandName
            FROM 
                Merch m
                JOIN 
            Brand b ON m.brand_id = b.id
            JOIN 
                Category c ON m.category_id = c.id
            WHERE m.category_id = @categoryId";

        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@categoryId", SqlDbType.Int) { Value = categoryId });
                using (var reader = command.ExecuteReader())
                {
                    var merchList = new List<MerchandiseDto>();
                    while (reader.Read())
                    {
                        var merchandise = new MerchandiseDto
                        {
                            Id = (int)reader["id"],
                            CategoryId = (int)reader["category_id"],
                            CategoryName = (string)reader["CategoryName"],
                            Name = (string)reader["name"],
                            Price = (int)reader["price"],
                            Description = (string)reader["description"],
                            BrandId = (int)reader["brand_id"],
                            BrandName = (string)reader["BrandName"],
                            Ratings = new List<RatingDto>(),
                            Themes = new List<ThemeDto>(),
                            Sizes = new List<MerchSizeDto>()
                        };
                        merchList.Add(merchandise);
                    }

                    // Populate Ratings, Themes, and Sizes for each merchandise
                    foreach (var merchandise in merchList)
                    {
                        merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
                        merchandise.Themes = GetThemesByMerchId(merchandise.Id);
                        merchandise.Sizes = GetSizesByMerchId(merchandise.Id, merchandise.CategoryId);
                    }

                    return merchList;
                }
            }
        }
    }

    public InsertResult InsertMerch(MerchandiseCreateDto merchandise)
    {
        var insertMerchCommandText = "INSERT INTO Merch (category_id, name, price, description, brand_id) " +
                                     "OUTPUT INSERTED.ID " +
                                     "VALUES (@categoryId, @name, @price, @description, @brandId);";

        using (var insertMerchCommand = new SqlCommand(insertMerchCommandText))
        {
            insertMerchCommand.Parameters.Add("categoryId", SqlDbType.Int).Value = merchandise.CategoryId;
            insertMerchCommand.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = merchandise.Name;
            insertMerchCommand.Parameters.Add("price", SqlDbType.Int).Value = merchandise.Price;
            insertMerchCommand.Parameters.Add("description", SqlDbType.NVarChar, 255).Value = merchandise.Description;
            insertMerchCommand.Parameters.Add("brandId", SqlDbType.Int).Value = merchandise.BrandId;

            var merchId = ExecuteScalar(insertMerchCommand);

            if (merchandise.Sizes != null && merchandise.Sizes.Any())
                foreach (var sizeDto in merchandise.Sizes)
                {
                    var sizeValue = sizeDto.Size;
                    var insertMerchSizeCommandText = "INSERT INTO MerchSize (merch_id, size, instock) " +
                                                     "VALUES (@merchId, @size, @instock);";

                    using (var insertMerchSizeCommand = new SqlCommand(insertMerchSizeCommandText))
                    {
                        insertMerchSizeCommand.Parameters.Add("merchId", SqlDbType.Int).Value = merchId;
                        insertMerchSizeCommand.Parameters.Add("size", SqlDbType.NVarChar, 255).Value =
                            sizeValue ?? (object)DBNull.Value;
                        insertMerchSizeCommand.Parameters.Add("instock", SqlDbType.Int).Value = sizeDto.InStock;

                        if (ExecuteNonQuery(insertMerchSizeCommand) != 1) return InsertResult.Error;
                    }
                }

            if (merchandise.ThemeIds != null && merchandise.ThemeIds.Any())
                foreach (var themeId in merchandise.ThemeIds)
                {
                    var insertMerchThemeCommandText = "INSERT INTO MerchTheme (merch_id, theme_id) " +
                                                      "VALUES (@merchId, @themeId);";

                    using (var insertMerchThemeCommand = new SqlCommand(insertMerchThemeCommandText))
                    {
                        insertMerchThemeCommand.Parameters.Add("merchId", SqlDbType.Int).Value = merchId;
                        insertMerchThemeCommand.Parameters.Add("themeId", SqlDbType.Int).Value = themeId;

                        if (ExecuteNonQuery(insertMerchThemeCommand) != 1) return InsertResult.Error;
                    }
                }

            return InsertResult.Success;
        }
    }


    public bool DeleteMerchandiseById(int id)
    {
        var deleteMerchSizeCommandText = "DELETE FROM MerchSize WHERE merch_id = @id;";
        var deleteMerchThemeCommandText = "DELETE FROM MerchTheme WHERE merch_id = @id;";
        var deleteMerchCommandText = "DELETE FROM Merch WHERE id = @id;";

        using (var deleteMerchSizeCommand = new SqlCommand(deleteMerchSizeCommandText))
        {
            deleteMerchSizeCommand.Parameters.Add("id", SqlDbType.Int).Value = id;
            ExecuteNonQuery(deleteMerchSizeCommand);
        }

        using (var deleteMerchThemeCommand = new SqlCommand(deleteMerchThemeCommandText))
        {
            deleteMerchThemeCommand.Parameters.Add("id", SqlDbType.Int).Value = id;
            ExecuteNonQuery(deleteMerchThemeCommand);
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

        if (!updateFields.Any()) throw new ArgumentException("No fields to update.");

        var updateMerchQuery = $"UPDATE Merch SET {string.Join(", ", updateFields)} WHERE id = @Id";
        command.CommandText = updateMerchQuery;
        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;

        using (var connection = CreateConnection())
        {
            command.Connection = connection;
            connection.Open();
            var rowsAffected = command.ExecuteNonQuery();
            return rowsAffected > 0;
        }
    }

    public List<string>? GetSizesByCategoryId(int categoryId)
    {
        return categoryId switch
        {
            1 => Enum.GetValues(typeof(ShoeSize))
                .Cast<ShoeSize>()
                .Select(e => e.ToString())
                .ToList(),

            2 => Enum.GetValues(typeof(ApparelSize))
                .Cast<ApparelSize>()
                .Select(e => e.ToString())
                .ToList(),

            3 => Enum.GetValues(typeof(AccessorySize))
                .Cast<AccessorySize>()
                .Select(e => e.ToString())
                .ToList(),

            _ => null
        };
    }

    public List<CategoryDto> GetCategories()
    {
        var categories = new List<CategoryDto>();
        var query = "SELECT id, name FROM Category";

        using (var connection = CreateConnection())
        using (var command = new SqlCommand(query, connection))
        {
            connection.Open();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                    categories.Add(new CategoryDto
                    {
                        Id = (int)reader["id"],
                        Name = (string)reader["name"]
                    });
            }
        }

        return categories;
    }

    public List<ThemeDto> GetThemes()
    {
        var themes = new List<ThemeDto>();
        var query = "SELECT id, name FROM Theme";

        using (var connection = CreateConnection())
        using (var command = new SqlCommand(query, connection))
        {
            connection.Open();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                    themes.Add(new ThemeDto
                    {
                        Id = (int)reader["id"],
                        Name = (string)reader["name"]
                    });
            }
        }

        return themes;
    }

    public List<BrandDto> GetBrands()
    {
        var brands = new List<BrandDto>();
        var query = "SELECT id, name FROM Brand";

        using (var connection = CreateConnection())
        using (var command = new SqlCommand(query, connection))
        {
            connection.Open();
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                    brands.Add(new BrandDto
                    {
                        Id = (int)reader["id"],
                        Name = (string)reader["name"]
                    });
            }
        }

        return brands;
    }

    public int AddCategoryToDb(CategoryCreateDto categoryCreateDto)
    {
        var query = "INSERT INTO Category (name) OUTPUT INSERTED.ID VALUES (@name)";

        try
        {
            using (var connection = CreateConnection())
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@name", SqlDbType.NVarChar, 255)
                    { Value = categoryCreateDto.Name });

                connection.Open();
                return (int)command.ExecuteScalar();
            }
        }
        catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601) // Handle unique constraint violation
        {
            throw new InvalidOperationException("A category with the same name already exists.");
        }
    }

    public int AddThemeToDb(ThemeCreateDto themeCreateDto)
    {
        var query = "INSERT INTO Theme (name) OUTPUT INSERTED.ID VALUES (@name)";

        try
        {
            using (var connection = CreateConnection())
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@name", SqlDbType.NVarChar, 255)
                    { Value = themeCreateDto.Name });

                connection.Open();
                return (int)command.ExecuteScalar();
            }
        }
        catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
        {
            throw new InvalidOperationException("A theme with the same name already exists.");
        }
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
    }


    // Helper function to get themes for a specific merchandise
    private List<ThemeDto> GetThemesByMerchId(int merchId)
    {
        var query = @"
            SELECT t.id, t.name
            FROM Theme t
            JOIN MerchTheme mt ON t.id = mt.theme_id
            WHERE mt.merch_id = @merchId";

        var themes = new List<ThemeDto>();
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@merchId", SqlDbType.Int) { Value = merchId });
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                        themes.Add(new ThemeDto
                        {
                            Id = (int)reader["id"],
                            Name = (string)reader["name"]
                        });
                }
            }
        }

        return themes;
    }

    // Helper function to get sizes for a specific merchandise
    private List<MerchSizeDto> GetSizesByMerchId(int merchId, int categoryId)
    {
        var query = @"
        SELECT id, merch_id, size, instock
        FROM MerchSize
        WHERE merch_id = @merchId";

        var sizes = new List<MerchSizeDto>();
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.Add(new SqlParameter("@merchId", SqlDbType.Int) { Value = merchId });
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var sizeDto = new MerchSizeDto
                        {
                            Id = (int)reader["id"],
                            MerchId = (int)reader["merch_id"],
                            Size = reader["size"] == DBNull.Value ? null : (string)reader["size"],
                            InStock = (int)reader["instock"]
                        };
                        sizes.Add(sizeDto);
                    }
                }
            }
        }

        return sizes;
    }
}