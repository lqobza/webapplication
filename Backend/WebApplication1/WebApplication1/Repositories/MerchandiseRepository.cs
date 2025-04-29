﻿using System.Data.SqlClient;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class MerchandiseRepository : IMerchandiseRepository
{
    private readonly ILogger<MerchandiseRepository> _logger;
    private readonly IRatingRepository _ratingRepository;
    private readonly IDatabaseWrapper _db;

    public MerchandiseRepository(IRatingRepository ratingRepository, IDatabaseWrapper databaseWrapper,
        ILogger<MerchandiseRepository> logger)
    {
        _ratingRepository = ratingRepository;
        _db = databaseWrapper;
        _logger = logger;
    }

    public bool MerchandiseExists(int categoryId, string name, int brandId)
    {
        const string command = "[dbo].[CheckMerchExistence]";

        var existsParam = new SqlParameter("@exists", System.Data.SqlDbType.Bit)
        {
            Direction = System.Data.ParameterDirection.Output
        };

        var parameters = new[]
        {
            new SqlParameter("@categoryId", categoryId),
            new SqlParameter("@name", name),
            new SqlParameter("@brandId", brandId),
            existsParam
        };

        var result = _db.ExecuteScalar(command, parameters);
        return Convert.ToInt32(result) > 0;
    }
    
    public bool MerchandiseExistsWithId(int id)
    {
        const string sql = "SELECT COUNT(1) FROM Merch WHERE id = @id";
        var parameters = new[] { new SqlParameter("@id", id) };
        var exists = (int) _db.ExecuteScalar(sql, parameters) > 0;
        return exists;
    }

    public PaginatedResponse<MerchandiseDto> GetAllMerchandise(int page = 1, int pageSize = 10)
    {
        var merchList = new List<MerchandiseDto>();
        var totalCount = 0;

        const string command = "[dbo].[GetAllMerchandise]";
        var parameters = new[]
        {
            new SqlParameter("@PageNumber", page),
            new SqlParameter("@PageSize", pageSize)
        };

        using var reader = _db.ExecuteReader(command, parameters);
        while (reader.Read())
        {
            totalCount = (int)reader["TotalCount"];
            var merchandise = merchList.FirstOrDefault(m => m.Id == (int)reader["id"]);

            if (merchandise != null) continue;
            merchandise = new MerchandiseDto
            {
                Id = (int)reader["id"],
                CategoryId = (int)reader["category_id"],
                CategoryName = (string)reader["CategoryName"],
                Name = (string)reader["name"],
                Price = (int)reader["price"],
                Description = (string)reader["description"],
                BrandId = (int)reader["brand_id"],
                BrandName = (string)reader["BrandName"],
                Themes = new List<ThemeDto>(),
                Sizes = new List<MerchSizeDto>()
            };

            if (reader["theme_id"] != DBNull.Value)
                merchandise.Themes.Add(new ThemeDto
                {
                    Id = (int)reader["theme_id"],
                    Name = (string)reader["theme_name"]
                });

            if (reader["size_id"] != DBNull.Value)
                merchandise.Sizes.Add(new MerchSizeDto
                {
                    Id = (int)reader["size_id"],
                    MerchId = (int)reader["id"],
                    Size = reader["size_name"] == DBNull.Value ? null : (string)reader["size_name"],
                    InStock = (int)reader["size_in_stock"]
                });

            merchandise.Images = GetImagesForMerchandise(merchandise.Id);

            merchList.Add(merchandise);
        }

        return new PaginatedResponse<MerchandiseDto>
        {
            Items = merchList,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public MerchandiseDto? GetMerchandiseById(int id)
    {
        MerchandiseDto? merchandise = null;

        const string command = "[dbo].[GetMerchandiseById]";
        var parameters = new[]
        {
            new SqlParameter("@Id", id)
        };

        using var reader = _db.ExecuteReader(command, parameters);
        while (reader.Read())
        {
            merchandise ??= new MerchandiseDto
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

            if (reader["rating_id"] != DBNull.Value)
            {
                var ratingId = (int)reader["rating_id"];
                if (merchandise.Ratings != null &&
                    merchandise.Ratings.All(r => r.Id != ratingId))
                    merchandise.Ratings.Add(new RatingDto
                    {
                        Id = ratingId,
                        MerchId = id,
                        Rating = (int)reader["rating_value"],
                        Description = reader["rating_description"] == DBNull.Value
                            ? null
                            : (string)reader["rating_description"],
                        CreatedAt = (DateTime)reader["rating_created_at"]
                    });
            }

            if (reader["theme_id"] != DBNull.Value)
            {
                var themeId = (int)reader["theme_id"];
                if (merchandise.Themes != null && merchandise.Themes.All(t => t.Id != themeId))
                    merchandise.Themes.Add(new ThemeDto
                    {
                        Id = themeId,
                        Name = (string)reader["theme_name"]
                    });
            }

            if (reader["size_id"] != DBNull.Value)
            {
                var sizeId = (int)reader["size_id"];
                if (merchandise.Sizes != null && merchandise.Sizes.All(s => s.Id != sizeId))
                    merchandise.Sizes.Add(new MerchSizeDto
                    {
                        Id = sizeId,
                        MerchId = id,
                        Size = reader["size_name"] == DBNull.Value ? null : (string)reader["size_name"],
                        InStock = (int)reader["size_in_stock"]
                    });
            }

            merchandise.Images = GetImagesForMerchandise(merchandise.Id);
        }

        return merchandise;
    }

    public List<MerchandiseDto> GetMerchandiseBySize(string size)
    {
        var merchList = new List<MerchandiseDto>();
        const string command = "[dbo].[GetMerchandiseBySize]";
        var parameters = new[]
        {
            new SqlParameter("@size", size)
        };

        using var reader = _db.ExecuteReader(command, parameters);

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
        const string command = "[dbo].[GetMerchandiseByCategory]";
        var parameters = new[]
        {
            new SqlParameter("@categoryId", categoryId)
        };

        using var reader = _db.ExecuteReader(command, parameters);
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

        foreach (var merchandise in merchList)
        {
            merchandise.Ratings = _ratingRepository.GetRatingsForMerchandise(merchandise.Id);
            merchandise.Themes = GetThemesByMerchId(merchandise.Id);
            merchandise.Sizes = GetSizesByMerchId(merchandise.Id);
        }

        return merchList;
    }

    public InsertResult InsertMerchandise(MerchandiseCreateDto merchandise)
    {
        const string command = "[dbo].[InsertMerchandise]";

        var parameters = new List<SqlParameter>
        {
            new("@categoryId", merchandise.CategoryId),
            new("@name", merchandise.Name),
            new("@price", merchandise.Price),
            new("@description", merchandise.Description),
            new("@brandId", merchandise.BrandId)
        };

        try
        {
            _db.ExecuteScalar(command, parameters.ToArray());

            return InsertResult.Success;
        }
        catch (Exception e)
        {
            _logger.LogError("Inserting merchandise failed: {Exception}", e);
            return InsertResult.Error;
        }
    }

    public bool DeleteMerchandiseById(int id)
    {
        const string command = "[dbo].[DeleteMerchandiseById]";
        var parameters = new[]
        {
            new SqlParameter("@id", id)
        };

        var rowsAffected = _db.ExecuteNonQuery(command, parameters);
        return rowsAffected >= 1;
    }

    public bool UpdateMerchandise(int id, MerchandiseUpdateDto merchandiseUpdateDto)
    {
        try
        {
            var updateFields = new List<string>();
            const string updateCommand = "[dbo].[UpdateMerchandise]";
            var parameters = new List<SqlParameter>();

            if (merchandiseUpdateDto.Price.HasValue)
            {
                updateFields.Add("price = @Price");
                parameters.Add(new SqlParameter("@Price", merchandiseUpdateDto.Price.Value));
            }

            if (!string.IsNullOrEmpty(merchandiseUpdateDto.Description))
            {
                updateFields.Add("description = @Description");
                parameters.Add(new SqlParameter("@Description", merchandiseUpdateDto.Description));
            }

            if (!updateFields.Any() && merchandiseUpdateDto.Sizes == null)
                throw new ArgumentException("No fields to update.");

            parameters.Add(new SqlParameter("@Id", id));

            var rowsAffected = _db.ExecuteNonQuery(updateCommand, parameters.ToArray());

            if (merchandiseUpdateDto.Sizes == null || !merchandiseUpdateDto.Sizes.Any()) return rowsAffected > 0;

            var currentSizes = GetSizesByMerchId(id);

            foreach (var sizeDto in merchandiseUpdateDto.Sizes)
            {
                var existingSize = currentSizes.FirstOrDefault(s => s.Size == sizeDto.Size);

                if (existingSize != null)
                {
                    const string updateSizeCommand = @"
                            UPDATE MerchSize 
                            SET instock = @InStock 
                            WHERE id = @SizeId";

                    var sizeParams = new[]
                    {
                        new SqlParameter("@SizeId", existingSize.Id),
                        new SqlParameter("@InStock", sizeDto.InStock)
                    };

                    _db.ExecuteNonQuery(updateSizeCommand, sizeParams);
                    rowsAffected++;
                }
                else
                {
                    const string insertSizeCommand = @"
                            INSERT INTO MerchSize (merch_id, size, instock)
                            VALUES (@MerchId, @Size, @InStock)";

                    var sizeParams = new[]
                    {
                        new SqlParameter("@MerchId", id),
                        new SqlParameter("@Size", sizeDto.Size),
                        new SqlParameter("@InStock", sizeDto.InStock)
                    };

                    _db.ExecuteNonQuery(insertSizeCommand, sizeParams);
                    rowsAffected++;
                }
            }

            var sizesToRemove = currentSizes
                .Where(cs => merchandiseUpdateDto.Sizes.All(us => us.Size != cs.Size))
                .ToList();

            foreach (var sizeToRemove in sizesToRemove)
            {
                const string deleteSizeCommand = "DELETE FROM MerchSize WHERE id = @SizeId";
                var deleteParams = new[] { new SqlParameter("@SizeId", sizeToRemove.Id) };

                _db.ExecuteNonQuery(deleteSizeCommand, deleteParams);
                rowsAffected++;
            }

            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating merchandise with ID {Id}", id);
            throw;
        }
    }

    public List<string>? GetSizesByCategoryId(int categoryId)
    {
        return categoryId switch
        {
            1 => Enum.GetValues(typeof(ApparelSize))
                .Cast<ApparelSize>()
                .Select(e => e.ToString())
                .ToList(),

            2 => Enum.GetValues(typeof(ApparelSize))
                .Cast<ApparelSize>()
                .Select(e => e.ToString())
                .ToList(),

            3 => Enum.GetValues(typeof(ApparelSize))
                .Cast<ApparelSize>()
                .Select(e => e.ToString())
                .ToList(),

            4 => Enum.GetValues(typeof(ApparelSize))
                .Cast<ApparelSize>()
                .Select(e => e.ToString())
                .ToList(),

            5 => null,

            6 => Enum.GetValues(typeof(ShoeSize))
                .Cast<ShoeSize>()
                .Select(e => e.ToString())
                .ToList(),

            _ => null
        };
    }

    public List<CategoryDto> GetCategories()
    {
        var categories = new List<CategoryDto>();
        const string command = @"SELECT id, name FROM Category;";

        using var reader = _db.ExecuteReader(command);

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
        const string command = @"SELECT id, name FROM Theme;";

        using var reader = _db.ExecuteReader(command);

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
        const string command = @"SELECT id, name FROM Brand;";

        using var reader = _db.ExecuteReader(command);

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
            const string command = "[dbo].[InsertCategory]";
            var parameters = new[]
            {
                new SqlParameter("@name", categoryCreateDto.Name)
            };

            var result = _db.ExecuteScalar(command, parameters);
            return Convert.ToInt32(result);
        }
        catch (SqlException ex)
        {
            if (ex.Message.Contains("already exists")) return -1;

            throw;
        }
    }

    public int AddThemeToDb(ThemeCreateDto themeCreateDto)
    {
        try
        {
            const string command = "[dbo].[InsertTheme]";
            var parameters = new[]
            {
                new SqlParameter("@name", themeCreateDto.Name)
            };

            var result = _db.ExecuteScalar(command, parameters);
            return Convert.ToInt32(result);
        }
        catch (SqlException ex)
        {
            if (ex.Message.Contains("already exists")) return -1;

            throw;
        }
    }

    private List<ThemeDto> GetThemesByMerchId(int merchId)
    {
        const string command = @"
            SELECT t.id, t.name
            FROM Theme t
            JOIN MerchTheme mt ON t.id = mt.theme_id
            WHERE mt.merch_id = @merchId";

        var parameters = new[]
        {
            new SqlParameter("@merchId", merchId)
        };

        var themes = new List<ThemeDto>();
        using var reader = _db.ExecuteReader(command, parameters);

        while (reader.Read())
            themes.Add(new ThemeDto
            {
                Id = (int)reader["id"],
                Name = (string)reader["name"]
            });

        return themes;
    }

    public List<MerchSizeDto> GetSizesByMerchId(int merchId)
    {
        const string command = @"
        SELECT id, merch_id, size, instock
        FROM MerchSize
        WHERE merch_id = @merchId";

        var parameters = new[]
        {
            new SqlParameter("@merchId", merchId)
        };

        var sizes = new List<MerchSizeDto>();
        using var reader = _db.ExecuteReader(command, parameters);

        while (reader.Read())
        {
            var sizeDto = new MerchSizeDto
            {
                Id = (int)reader["id"],
                MerchId = reader["merch_id"] != DBNull.Value ? (int)reader["merch_id"] : 0,
                Size = reader["size"] == DBNull.Value ? null : (string)reader["size"],
                InStock = (int)reader["instock"]
            };
            sizes.Add(sizeDto);
        }

        return sizes;
    }

    private List<MerchandiseImage> GetImagesForMerchandise(int merchandiseId)
    {
        const string command = @"
            SELECT id, MerchId, ImageUrl, IsPrimary, CreatedAt
            FROM MerchandiseImages
            WHERE MerchId = @MerchandiseId
        ";

        var parameters = new[]
        {
            new SqlParameter("@MerchandiseId", merchandiseId)
        };

        var images = new List<MerchandiseImage>();
        using var reader = _db.ExecuteReader(command, parameters);

        while (reader.Read())
            images.Add(new MerchandiseImage
            {
                Id = (int)reader["id"],
                MerchId = (int)reader["MerchId"],
                ImageUrl = (string)reader["ImageUrl"],
                IsPrimary = (bool)reader["IsPrimary"],
                CreatedAt = reader["CreatedAt"] != DBNull.Value ? (DateTime)reader["CreatedAt"] : DateTime.UtcNow
            });

        return images;
    }

    public PaginatedResponse<MerchandiseDto> SearchMerchandise(MerchandiseSearchDto searchParams)
    {
        var merchList = new List<MerchandiseDto>();
        var totalCount = 0;

        const string command = "[dbo].[SearchMerchandise]";
        var parameters = new List<SqlParameter>
        {
            new("@PageNumber", searchParams.Page),
            new("@PageSize", searchParams.PageSize),
            new("@Keywords", (object?)searchParams.Keywords ?? DBNull.Value),
            new("@MinPrice", (object?)searchParams.MinPrice ?? DBNull.Value),
            new("@MaxPrice", (object?)searchParams.MaxPrice ?? DBNull.Value),
            new("@CategoryId", (object?)searchParams.CategoryId ?? DBNull.Value),
            new("@SortBy", (object?)(searchParams.SortBy?.ToString() ?? "") ?? DBNull.Value)
        };

        using var reader = _db.ExecuteReader(command, parameters.ToArray());
        while (reader.Read())
        {
            totalCount = (int)reader["TotalCount"];
            var merchandise = merchList.FirstOrDefault(m => m.Id == (int)reader["id"]);

            if (merchandise != null) continue;
            merchandise = new MerchandiseDto
            {
                Id = (int)reader["id"],
                CategoryId = (int)reader["category_id"],
                CategoryName = (string)reader["CategoryName"],
                Name = (string)reader["name"],
                Price = (int)reader["price"],
                Description = (string)reader["description"],
                BrandId = (int)reader["brand_id"],
                BrandName = (string)reader["BrandName"],
                Themes = new List<ThemeDto>(),
                Sizes = new List<MerchSizeDto>()
            };

            if (reader["theme_id"] != DBNull.Value)
                merchandise.Themes.Add(new ThemeDto
                {
                    Id = (int)reader["theme_id"],
                    Name = (string)reader["theme_name"]
                });

            if (reader["size_id"] != DBNull.Value)
                merchandise.Sizes.Add(new MerchSizeDto
                {
                    Id = (int)reader["size_id"],
                    MerchId = (int)reader["id"],
                    Size = reader["size_name"] == DBNull.Value ? null : (string)reader["size_name"],
                    InStock = (int)reader["size_in_stock"]
                });

            merchandise.Images = GetImagesForMerchandise(merchandise.Id);

            merchList.Add(merchandise);
        }

        return new PaginatedResponse<MerchandiseDto>
        {
            Items = merchList,
            TotalCount = totalCount,
            PageNumber = searchParams.Page,
            PageSize = searchParams.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)searchParams.PageSize),
            HasNextPage = searchParams.Page * searchParams.PageSize < totalCount,
            HasPreviousPage = searchParams.Page > 1
        };
    }
}