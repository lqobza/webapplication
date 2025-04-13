using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories
{
    public class MerchandiseImageRepository : BaseRepository, IMerchandiseImageRepository
    {
        private readonly ILogger<MerchandiseImageRepository> _logger;
        private readonly IDatabaseWrapper _db;

        public MerchandiseImageRepository(ILogger<MerchandiseImageRepository> logger, IDatabaseWrapper databaseWrapper)
            : base(databaseWrapper)
        {
            _logger = logger;
            _db = databaseWrapper;
        }

        public async Task<List<MerchandiseImageDto>> GetImagesForMerchandise(int merchandiseId)
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

            var images = new List<MerchandiseImageDto>();
            using var reader = _db.ExecuteReader(command, parameters);

            while (reader.Read())
            {
                images.Add(new MerchandiseImageDto
                {
                    Id = (int)reader["id"],
                    MerchandiseId = (int)reader["MerchId"],
                    ImageUrl = (string)reader["ImageUrl"],
                    IsPrimary = (bool)reader["IsPrimary"],
                    CreatedAt = reader["CreatedAt"] != DBNull.Value ? (DateTime)reader["CreatedAt"] : DateTime.UtcNow
                });
            }

            return await Task.FromResult(images);
        }

        public async Task<MerchandiseImageDto> AddImage(int merchandiseId, string imageUrl, bool isPrimary = false)
        {
            try
            { 
                const string command = "SELECT COUNT(1) FROM Merch WHERE id = @id";
                var checkParam = new SqlParameter("@id", merchandiseId);
                var count = Convert.ToInt32(_db.ExecuteScalar(command, checkParam));
                
                if (count == 0)
                {
                    throw new KeyNotFoundException($"Merchandise with ID {merchandiseId} does not exist");
                }
 
                if (isPrimary)
                {
                    const string updateExistingCommand = @"
                        UPDATE MerchandiseImages 
                        SET IsPrimary = 0 
                        WHERE MerchId = @MerchId AND IsPrimary = 1";
                    
                    var updateParams = new[]
                    {
                        new SqlParameter("@MerchId", merchandiseId)
                    };
                    
                    _db.ExecuteNonQuery(updateExistingCommand, updateParams);
                }
 
                const string insertCommand = @"
                    INSERT INTO MerchandiseImages (MerchId, ImageUrl, IsPrimary, CreatedAt)
                    OUTPUT INSERTED.Id, INSERTED.MerchId, INSERTED.ImageUrl, INSERTED.IsPrimary, INSERTED.CreatedAt
                    VALUES (@MerchId, @ImageUrl, @IsPrimary, @CreatedAt)";
                
                var insertParams = new[]
                {
                    new SqlParameter("@MerchId", merchandiseId),
                    new SqlParameter("@ImageUrl", imageUrl),
                    new SqlParameter("@IsPrimary", isPrimary),
                    new SqlParameter("@CreatedAt", DateTime.UtcNow)
                };
                
                using var reader = _db.ExecuteReader(insertCommand, insertParams);
                var imageDto = new MerchandiseImageDto();
                
                if (reader.Read())
                {
                    imageDto.Id = (int)reader["Id"];
                    imageDto.MerchandiseId = (int)reader["MerchId"];
                    imageDto.ImageUrl = (string)reader["ImageUrl"];
                    imageDto.IsPrimary = (bool)reader["IsPrimary"];
                    imageDto.CreatedAt = (DateTime)reader["CreatedAt"];
                }
                else
                {
                    throw new InvalidOperationException("Failed to insert merchandise image");
                }

                return await Task.FromResult(imageDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add image for merchandise {MerchandiseId}", merchandiseId);
                ex.Data["ImageUrl"] = imageUrl;
                throw;
            }
        }

        public async Task<bool> DeleteImage(int imageId)
        {
            const string command = "DELETE FROM MerchandiseImages WHERE Id = @ImageId";
            var parameters = new[]
            {
                new SqlParameter("@ImageId", imageId)
            };
            
            var rowsAffected = _db.ExecuteNonQuery(command, parameters);
            return await Task.FromResult(rowsAffected > 0);
        }

        public async Task<bool> SetPrimaryImage(int merchandiseId, int imageId)
        { 
            const string resetCommand = @"
                UPDATE MerchandiseImages 
                SET IsPrimary = 0 
                WHERE MerchId = @MerchId AND IsPrimary = 1";
            
            var resetParams = new[]
            {
                new SqlParameter("@MerchId", merchandiseId)
            };
            
            _db.ExecuteNonQuery(resetCommand, resetParams);
             
            const string updateCommand = @"
                UPDATE MerchandiseImages 
                SET IsPrimary = 1 
                WHERE Id = @ImageId AND MerchId = @MerchId";
            
            var updateParams = new[]
            {
                new SqlParameter("@ImageId", imageId),
                new SqlParameter("@MerchId", merchandiseId)
            };
            
            var rowsAffected = _db.ExecuteNonQuery(updateCommand, updateParams);
            return await Task.FromResult(rowsAffected > 0);
        }

        public List<MerchandiseImageDto> GetMerchandiseImages(int merchandiseId)
        {
            try
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

                var images = new List<MerchandiseImageDto>();
                using var reader = _db.ExecuteReader(command, parameters);

                while (reader.Read())
                {
                    images.Add(new MerchandiseImageDto
                    {
                        Id = (int)reader["id"],
                        MerchandiseId = (int)reader["MerchId"],
                        ImageUrl = (string)reader["ImageUrl"],
                        IsPrimary = (bool)reader["IsPrimary"]
                    });
                }
                    
                return images;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving images for merchandise {MerchandiseId}", merchandiseId);
                return new List<MerchandiseImageDto>();
            }
        }
    }
} 