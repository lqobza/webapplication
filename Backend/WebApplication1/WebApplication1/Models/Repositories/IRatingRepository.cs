namespace WebApplication1.Models.Repositories;

public interface IRatingRepository
{
    public bool AddRating(RatingCreateDto ratingCreateDto);
}