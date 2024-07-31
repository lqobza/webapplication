namespace WebApplication1.Models.Services;

public interface IRatingService
{
    public bool AddRating(RatingCreateDto ratingCreateDto);
    public List<RatingDto> GetRatingsForMerchandise(int merchId);
}