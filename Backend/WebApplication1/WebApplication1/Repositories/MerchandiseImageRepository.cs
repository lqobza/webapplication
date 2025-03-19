using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;
using WebApplication1.Utils;
using System.Data.SqlClient;

namespace WebApplication1.Repositories
{
    public class MerchandiseImageRepository : IMerchandiseImageRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MerchandiseImageRepository> _logger;

        public MerchandiseImageRepository(ApplicationDbContext context, ILogger<MerchandiseImageRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<MerchandiseImageDto>> GetImagesForMerchandise(int merchandiseId)
        {
            var images = await _context.MerchandiseImages
                .Where(mi => mi.MerchId == merchandiseId)
                .Select(mi => new MerchandiseImageDto
                {
                    Id = mi.Id,
                    ImageUrl = mi.ImageUrl,
                    IsPrimary = mi.IsPrimary,
                    MerchandiseId = mi.MerchId
                })
                .ToListAsync();

            return images;
        }

        public async Task<MerchandiseImageDto> AddImage(int merchandiseId, string imageUrl, bool isPrimary = false)
        {
            try
            {
                var sql = "SELECT COUNT(1) FROM Merch WHERE id = @id";
                var parameter = new Microsoft.Data.SqlClient.SqlParameter("@id", merchandiseId);
                var count = await _context.Database.ExecuteSqlRawAsync(sql, parameter);
                
                if (count == 0)
                {
                    throw new KeyNotFoundException($"Merchandise with ID {merchandiseId} does not exist");
                }

                if (isPrimary)
                {
                    var existingPrimary = await _context.MerchandiseImages
                        .Where(mi => mi.MerchId == merchandiseId && mi.IsPrimary)
                        .FirstOrDefaultAsync();
                    
                    if (existingPrimary != null)
                    {
                        existingPrimary.IsPrimary = false;
                    }
                }

                var image = new MerchandiseImage
                {
                    MerchId = merchandiseId,
                    ImageUrl = imageUrl,
                    IsPrimary = isPrimary,
                    CreatedAt = DateTime.UtcNow
                };

                _context.MerchandiseImages.Add(image);
                await _context.SaveChangesAsync();

                return new MerchandiseImageDto
                {
                    Id = image.Id,
                    ImageUrl = image.ImageUrl,
                    IsPrimary = image.IsPrimary,
                    MerchandiseId = image.MerchId,
                    CreatedAt = image.CreatedAt
                };
            }
            catch (Exception ex)
            {
                ex.Data["ImageUrl"] = imageUrl;
                throw;
            }
        }

        public async Task<bool> DeleteImage(int imageId)
        {
            var image = await _context.MerchandiseImages.FindAsync(imageId);
            if (image == null) return false;

            _context.MerchandiseImages.Remove(image);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetPrimaryImage(int merchandiseId, int imageId)
        {
            var existingPrimary = await _context.MerchandiseImages
                .Where(mi => mi.MerchId == merchandiseId && mi.IsPrimary)
                .FirstOrDefaultAsync();
            
            if (existingPrimary != null)
            {
                existingPrimary.IsPrimary = false;
            }

            var newPrimary = await _context.MerchandiseImages
                .FirstOrDefaultAsync(mi => mi.Id == imageId && mi.MerchId == merchandiseId);
            
            if (newPrimary == null) return false;

            newPrimary.IsPrimary = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public List<MerchandiseImageDto> GetMerchandiseImages(int merchandiseId)
        {
            try
            {
                var images = _context.MerchandiseImages
                    .Where(mi => mi.MerchId == merchandiseId)
                    .AsQueryable()
                    .Select(mi => new MerchandiseImageDto
                    {
                        Id = mi.Id,
                        MerchandiseId = mi.MerchId,
                        ImageUrl = mi.ImageUrl,
                        IsPrimary = mi.IsPrimary
                    })
                    .ToList();
                    
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