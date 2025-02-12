using WebApplication1.Models;
using WebApplication1.Models.DTOs;

namespace WebApplication1.Repositories.Interface;

public interface IRatingRepository
{
    public bool AddRating(RatingCreateDto ratingCreateDto);
    public List<RatingDto> GetRatingsForMerchandise(int merchId);
}