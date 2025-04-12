using System.Diagnostics;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services;

namespace TestProject1.ServiceTests
{
    [TestFixture]
    public class RatingServiceTests
    {
        private Mock<IRatingRepository> _mockRatingRepository = null!;
        private RatingService _ratingService = null!;

        [SetUp]
        public void Setup()
        {
            _mockRatingRepository = new Mock<IRatingRepository>();
            _ratingService = new RatingService(_mockRatingRepository.Object);
        }

        [Test]
        public void AddRating_ValidRating_ReturnsTrue()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 1,
                Rating = 5,
                Description = "Excellent product!"
            };

            _mockRatingRepository.Setup(repo => repo.AddRating(It.IsAny<RatingCreateDto>()))
                .Returns(true);

            // Act
            var result = _ratingService.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.True);
            _mockRatingRepository.Verify(repo => repo.AddRating(ratingCreateDto), Times.Once);
        }

        [Test]
        public void AddRating_RepositoryError_ReturnsFalse()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 1,
                Rating = 4,
                Description = "Good product"
            };

            _mockRatingRepository.Setup(repo => repo.AddRating(It.IsAny<RatingCreateDto>()))
                .Returns(false);

            // Act
            var result = _ratingService.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.False);
            _mockRatingRepository.Verify(repo => repo.AddRating(ratingCreateDto), Times.Once);
        }

        [Test]
        public void AddRating_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 999, // Non-existent merchandise
                Rating = 5,
                Description = "Can't rate this"
            };

            _mockRatingRepository.Setup(repo => repo.AddRating(It.IsAny<RatingCreateDto>()))
                .Throws(new ArgumentException("Merchandise not found"));

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => _ratingService.AddRating(ratingCreateDto));
            Debug.Assert(ex != null, nameof(ex) + " != null");
            Assert.That(ex.Message, Is.EqualTo("Merchandise not found"));
        }

        [Test]
        public void GetRatingsForMerchandise_ExistingMerchandise_ReturnsRatings()
        {
            // Arrange
            const int merchId = 1;
            var expectedRatings = new List<RatingDto>
            {
                new()
                {
                    Id = 1,
                    MerchId = merchId,
                    Rating = 5,
                    Description = "Excellent!",
                    CreatedAt = DateTime.Now.AddDays(-5)
                },
                new()
                {
                    Id = 2,
                    MerchId = merchId,
                    Rating = 4,
                    Description = "Very good",
                    CreatedAt = DateTime.Now.AddDays(-2)
                }
            };

            _mockRatingRepository.Setup(repo => repo.GetRatingsForMerchandise(merchId))
                .Returns(expectedRatings);

            // Act
            var result = _ratingService.GetRatingsForMerchandise(merchId);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result, Has.Count.EqualTo(2));
            Assert.That(result, Is.EqualTo(expectedRatings));
            _mockRatingRepository.Verify(repo => repo.GetRatingsForMerchandise(merchId), Times.Once);
        }

        [Test]
        public void GetRatingsForMerchandise_NonExistentMerchandise_ReturnsEmptyList()
        {
            // Arrange
            const int merchId = 999;
            var emptyRatingsList = new List<RatingDto>();

            _mockRatingRepository.Setup(repo => repo.GetRatingsForMerchandise(merchId))
                .Returns(emptyRatingsList);

            // Act
            var result = _ratingService.GetRatingsForMerchandise(merchId);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result, Is.Empty);
            _mockRatingRepository.Verify(repo => repo.GetRatingsForMerchandise(merchId), Times.Once);
        }

        [Test]
        public void GetRatingsForMerchandise_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            const int merchId = -1; // Invalid ID
            
            _mockRatingRepository.Setup(repo => repo.GetRatingsForMerchandise(merchId))
                .Throws(new ArgumentException("Invalid merchandise ID"));

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => _ratingService.GetRatingsForMerchandise(merchId));
            Debug.Assert(ex != null, nameof(ex) + " != null");
            Assert.That(ex.Message, Is.EqualTo("Invalid merchandise ID"));
        }
    }
} 