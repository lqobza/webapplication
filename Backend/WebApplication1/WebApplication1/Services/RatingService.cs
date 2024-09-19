using WebApplication1.Models;
using WebApplication1.Models.Repositories;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;

namespace WebApplication1.Services;

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

    public List<RatingDto> GetRatingsForMerchandise(int merchId)
    {
        return _ratingRepository.GetRatingsForMerchandise(merchId);
    }
}