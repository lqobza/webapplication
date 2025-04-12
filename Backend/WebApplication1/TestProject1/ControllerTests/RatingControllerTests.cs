using System.Diagnostics;
using WebApplication1.Models.DTOs;
using WebApplication1.Services.Interface;
using Newtonsoft.Json;

namespace TestProject1.ControllerTests
{
    [TestFixture]
    public class RatingControllerTests
    {
        private Mock<IRatingService> _mockRatingService = null!;
        private Mock<ILogger<RatingController>> _mockLogger = null!;
        private RatingController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _mockRatingService = new Mock<IRatingService>();
            _mockLogger = new Mock<ILogger<RatingController>>();
            _controller = new RatingController(_mockRatingService.Object, _mockLogger.Object);
        }

        [Test]
        public void AddRating_ValidData_ReturnsOk()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 1,
                Rating = 5,
                Description = "Excellent product!"
            };

            _mockRatingService.Setup(s => s.AddRating(It.IsAny<RatingCreateDto>()))
                .Returns(true);

            // Act
            var result = _controller.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            
            // Convert to JSON and deserialize to safely access properties
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            var json = JsonConvert.SerializeObject(okResult.Value);
            var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
            
            Assert.That(deserialized, Is.Not.Null);
            Assert.That((string)deserialized!.message, Is.EqualTo("Rating added successfully."));
        }

        [Test]
        public void AddRating_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                // Missing required MerchId and Rating
                Description = "Invalid rating"
            };

            _controller.ModelState.AddModelError("MerchId", "The MerchId field is required.");
            _controller.ModelState.AddModelError("Rating", "The Rating field is required.");

            // Act
            var result = _controller.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void AddRating_InvalidRatingValue_ReturnsBadRequest()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 1,
                Rating = 10, // Rating should be between 1 and 5
                Description = "Invalid rating value"
            };

            _controller.ModelState.AddModelError("Rating", "The field Rating must be between 1 and 5.");

            // Act
            var result = _controller.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void AddRating_MerchandiseNotFound_ReturnsBadRequest()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 999, // Non-existent merchandise
                Rating = 5,
                Description = "Rating for non-existent merchandise"
            };

            _mockRatingService.Setup(s => s.AddRating(It.IsAny<RatingCreateDto>()))
                .Throws(new ArgumentException($"Merchandise with ID {ratingCreateDto.MerchId} not found."));

            // Act
            var result = _controller.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<StatusCodeResult>());
            var statusCodeResult = result as StatusCodeResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(400));
        }

        [Test]
        public void AddRating_ServiceError_ReturnsInternalServerError()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 1,
                Rating = 5,
                Description = "Test rating"
            };

            _mockRatingService.Setup(s => s.AddRating(It.IsAny<RatingCreateDto>()))
                .Returns(false);

            // Act
            var result = _controller.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var statusCodeResult = result as ObjectResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
        }

        [Test]
        public void AddRating_UnexpectedException_ReturnsInternalServerError()
        {
            // Arrange
            var ratingCreateDto = new RatingCreateDto
            {
                MerchId = 1,
                Rating = 5,
                Description = "Test rating"
            };

            _mockRatingService.Setup(s => s.AddRating(It.IsAny<RatingCreateDto>()))
                .Throws(new Exception("Unexpected error"));

            // Act
            var result = _controller.AddRating(ratingCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<StatusCodeResult>());
            var statusCodeResult = result as StatusCodeResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
        }
    }
} 