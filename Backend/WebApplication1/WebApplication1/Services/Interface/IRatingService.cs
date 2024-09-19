﻿using WebApplication1.Models;

namespace WebApplication1.Services.Interface;

public interface IRatingService
{
    public bool AddRating(RatingCreateDto ratingCreateDto);
    public List<RatingDto> GetRatingsForMerchandise(int merchId);
}