using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using WebApplication1.Models.Enums;
using WebApplication1.Models.Repositories;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

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

    public bool MerchandiseExists(int categoryId, string name, int brandId)
    {
        using var command = new SqlCommand("[dbo].[CheckMerchExistence]");
        command.CommandType = CommandType.StoredProcedure;
        
        command.Parameters.Add("categoryId", SqlDbType.Int).Value = categoryId;
        command.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = name;
        command.Parameters.Add("brandId", SqlDbType.Int).Value = brandId;
        
        var existsParam = new SqlParameter("@exists", SqlDbType.Bit) { Direction = ParameterDirection.Output };
        command.Parameters.Add(existsParam);

        ExecuteScalar(command);
        return (bool)existsParam.Value;
    }

    public List<MerchandiseDto> GetAllMerchandise()
    {
        var merchList = new List<MerchandiseDto>();
        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand("[dbo].[GetAllMerchandise]", connection);
        command.CommandType = CommandType.StoredProcedure;
        
        using var reader = command.ExecuteReader();
        
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
            merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id); //TODO do these steps in the stored procedure to lower db connections
            merchandise.Themes = GetThemesByMerchId(merchandise.Id);
            merchandise.Sizes = GetSizesByMerchId(merchandise.Id);
        }

        return merchList;
    }


    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        var merchList = new List<MerchandiseDto>();
        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand("[dbo].[GetMerchandiseBySize]", connection);
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.Add(new SqlParameter("@size", SqlDbType.NVarChar, 255) { Value = size });
        
        using var reader = command.ExecuteReader();
        
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

        // Populate Ratings, Themes, and Sizes for each merchandise
        foreach (var merchandise in merchList)
        {
            merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
            merchandise.Themes = GetThemesByMerchId(merchandise.Id);
            merchandise.Sizes = GetSizesByMerchId(merchandise.Id);
        }

        return merchList;
    }

    public List<MerchandiseDto> GetMerchandiseByCategory(int categoryId)
    {
        using var connection = CreateConnection();
        connection.Open();
        
        using var command = new SqlCommand("[dbo].[GetMerchandiseByCategory]", connection);
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.Add(new SqlParameter("@categoryId", SqlDbType.Int) { Value = categoryId });
        
        using var reader = command.ExecuteReader();
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
            //TODO talán egyben, egyszerre le lehetne kérni az adatokat, hogy ne kelljen sokszor connection openelni
            merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
            merchandise.Themes = GetThemesByMerchId(merchandise.Id);
            merchandise.Sizes = GetSizesByMerchId(merchandise.Id);
        }

        return merchList;
    }

    public InsertResult InsertMerchandise(MerchandiseCreateDto merchandise)
    {
        using var insertMerchandiseCommand = new SqlCommand("[dbo].[InsertMerchandise]");
        insertMerchandiseCommand.CommandType = CommandType.StoredProcedure;

        insertMerchandiseCommand.Parameters.Add("categoryId", SqlDbType.Int).Value = merchandise.CategoryId;
        insertMerchandiseCommand.Parameters.Add("name", SqlDbType.NVarChar, 255).Value = merchandise.Name;
        insertMerchandiseCommand.Parameters.Add("price", SqlDbType.Decimal).Value = merchandise.Price;
        insertMerchandiseCommand.Parameters.Add("description", SqlDbType.NVarChar, 255).Value = merchandise.Description;
        insertMerchandiseCommand.Parameters.Add("brandId", SqlDbType.Int).Value = merchandise.BrandId;


        if (merchandise.Sizes != null)
        {
            //TODO: ez a rész nem jó
            var sizesTable = new DataTable();
            sizesTable.Columns.Add("Size", typeof(string));
            sizesTable.Columns.Add("InStock", typeof(int));
            foreach (var sizeDto in merchandise.Sizes)
            {
                sizesTable.Rows.Add(sizeDto.Size, sizeDto.InStock);
            }
            var sizesParam = insertMerchandiseCommand.Parameters.AddWithValue("sizes", sizesTable);
            sizesParam.SqlDbType = SqlDbType.Structured;
            sizesParam.TypeName = "dbo.MerchSizeType";
        }

        if (merchandise.ThemeIds != null)
        {
            // Add Themes Table-Valued Parameter if available
            var themesTable = new DataTable();
            themesTable.Columns.Add("ThemeId", typeof(int));
            foreach (var themeId in merchandise.ThemeIds)
            {
                themesTable.Rows.Add(themeId);
            }
            var themesParam = insertMerchandiseCommand.Parameters.AddWithValue("themes", themesTable);
            themesParam.SqlDbType = SqlDbType.Structured;
            themesParam.TypeName = "dbo.MerchThemeType";
        }

        var result = ExecuteScalar(insertMerchandiseCommand);

        return result is int ? InsertResult.Success : InsertResult.Error;
    }


    public bool DeleteMerchandiseById(int id)
    {
        using var command = new SqlCommand("[dbo].[DeleteMerchandiseById]");
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.Add("id", SqlDbType.Int).Value = id;
        return ExecuteNonQuery(command) == 1;
    }

    public bool UpdateMerchandise(int id, MerchandiseUpdateDto merchandiseUpdateDto)
    {
        var updateFields = new List<string>();
        var command = new SqlCommand("[dbo].[UpdateMerchandise]");
        command.CommandType = CommandType.StoredProcedure;
        
        if (merchandiseUpdateDto.Price.HasValue)
        {
            Console.WriteLine("Price value " + merchandiseUpdateDto.Price.Value);
            updateFields.Add("price = @Price");
            command.Parameters.Add("@Price", SqlDbType.Int).Value = merchandiseUpdateDto.Price.Value;
        }

        if (!string.IsNullOrEmpty(merchandiseUpdateDto.Description))
        {
            Console.WriteLine("Description value " + merchandiseUpdateDto.Description);
            updateFields.Add("description = @Description");
            command.Parameters.Add("@Description", SqlDbType.NVarChar, 255).Value = merchandiseUpdateDto.Description;
        }

        if (!updateFields.Any()) throw new ArgumentException("No fields to update.");

        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;

        using var connection = CreateConnection();
        
        command.Connection = connection;
        connection.Open();
        var rowsAffected = command.ExecuteNonQuery();
        return rowsAffected > 0;
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

        using var connection = CreateConnection();
        using var command = new SqlCommand("[dbo].[GetCategories]", connection);
        command.CommandType = CommandType.StoredProcedure;
        
        connection.Open();
        using var reader = command.ExecuteReader();
        
        while (reader.Read())
            categories.Add(new CategoryDto
            {
                Id = (int)reader["id"],
                Name = (string)reader["name"]
            });

        return categories;
    }

    public List<ThemeDto> GetThemes()
    {
        var themes = new List<ThemeDto>();

        using var connection = CreateConnection();
        using var command = new SqlCommand("[dbo].[GetThemes]", connection);
        command.CommandType = CommandType.StoredProcedure;
        
        connection.Open();
        using var reader = command.ExecuteReader();
        
        while (reader.Read())
            themes.Add(new ThemeDto
            {
                Id = (int)reader["id"],
                Name = (string)reader["name"]
            });

        return themes;
    }

    public List<BrandDto> GetBrands()
    {
        var brands = new List<BrandDto>();

        using var connection = CreateConnection();
        using var command = new SqlCommand("[dbo].[GetBrands]", connection);
        command.CommandType = CommandType.StoredProcedure;
        
        connection.Open();
        using var reader = command.ExecuteReader();
        
        while (reader.Read())
            brands.Add(new BrandDto
            {
                Id = (int)reader["id"],
                Name = (string)reader["name"]
            });

        return brands;
    }

    public int AddCategoryToDb(CategoryCreateDto categoryCreateDto)
    {
        try
        {
            using var connection = CreateConnection();
            using var command = new SqlCommand("[dbo].[InsertCategory]", connection);
            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add(new SqlParameter("@name", SqlDbType.NVarChar, 255)
                { Value = categoryCreateDto.Name });

            connection.Open();
            return (int)command.ExecuteScalar();
        }
        catch (SqlException ex)
        {
            if (ex.Message.Contains("already exists"))
            {
                return -1;
            }
            throw;
        }
    }

    public int AddThemeToDb(ThemeCreateDto themeCreateDto)
    {
        try
        {
            using var connection = CreateConnection();
            using var command = new SqlCommand("[dbo].[InsertTheme]", connection);
            command.CommandType = CommandType.StoredProcedure;
        
            command.Parameters.Add(new SqlParameter("@name", SqlDbType.NVarChar, 255)
                { Value = themeCreateDto.Name });

            connection.Open();
            return (int)command.ExecuteScalar();
        }
        catch (SqlException ex)
        {
            if (ex.Message.Contains("already exists"))
            {
                return -1;
            }
            throw;
        }
        
    }

    private int ExecuteNonQuery(SqlCommand dbCommand)
    {
        using var connection = CreateConnection();
        
        dbCommand.Connection = connection;
        connection.Open();

        using var dbTransaction = connection.BeginTransaction();
        
        try
        {
            dbCommand.Transaction = dbTransaction;
            var rowsAffected = dbCommand.ExecuteNonQuery();
            dbTransaction.Commit();
            return rowsAffected;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "A database error occurred while executing non-query.");
            //dbTransaction.Rollback();
            throw;
        }
    }

    private object ExecuteScalar(SqlCommand command)
    {
        if (command == null)
        {
            throw new ArgumentNullException(nameof(command));
        }

        using var connection = CreateConnection();
        command.Connection = connection;
        command.Connection.Open();
        return command.ExecuteScalar();
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
        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand(query, connection);
        
        command.Parameters.Add(new SqlParameter("@merchId", SqlDbType.Int) { Value = merchId });
        using var reader = command.ExecuteReader();
        
        while (reader.Read())
            themes.Add(new ThemeDto
            {
                Id = (int)reader["id"],
                Name = (string)reader["name"]
            });

        return themes;
    }

    // Helper function to get sizes for a specific merchandise
    private List<MerchSizeDto> GetSizesByMerchId(int merchId)
    {
        var query = @"
        SELECT id, merch_id, size, instock
        FROM MerchSize
        WHERE merch_id = @merchId";

        var sizes = new List<MerchSizeDto>();
        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand(query, connection);
        
        command.Parameters.Add(new SqlParameter("@merchId", SqlDbType.Int) { Value = merchId });
        using var reader = command.ExecuteReader();
        
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

        return sizes;
    }
}