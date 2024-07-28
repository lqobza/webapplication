using WebApplication1.Models.Repositories;

namespace WebApplication1.Models.Services;

public class RatingService : IRatingService
{
    private readonly IRatingRepository _ratingRepository;

    public RatingService(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }
    
    public bool AddRating(RatingCreateDto ratingCreateDto)
    {
        return _ratingRepository.AddRating(ratingCreateDto);
    }
}