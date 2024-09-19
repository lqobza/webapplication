using WebApplication1.Models;

namespace WebApplication1.Repositories.Interface;

public interface IRatingRepository
{
    public bool AddRating(RatingCreateDto ratingCreateDto);
    public List<RatingDto> GetRatingsForMerchandise(int merchId);
}