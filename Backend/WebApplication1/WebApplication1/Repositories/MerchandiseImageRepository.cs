using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;
using WebApplication1.Utils;

namespace WebApplication1.Repositories
{
    public class MerchandiseImageRepository : IMerchandiseImageRepository
    {
        private readonly ApplicationDbContext _context;

        public MerchandiseImageRepository(ApplicationDbContext context)
        {
            _context = context;
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
            if (isPrimary)
            {
                // Reset any existing primary image
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
                IsPrimary = isPrimary
            };

            _context.MerchandiseImages.Add(image);
            await _context.SaveChangesAsync();

            return new MerchandiseImageDto
            {
                Id = image.Id,
                ImageUrl = image.ImageUrl,
                IsPrimary = image.IsPrimary,
                MerchandiseId = image.MerchId
            };
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
    }
} 