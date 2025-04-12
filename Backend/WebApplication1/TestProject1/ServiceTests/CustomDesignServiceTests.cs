using System.Diagnostics;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services;

namespace TestProject1.ServiceTests
{
    [TestFixture]
    public class CustomDesignServiceTests
    {
        private Mock<ICustomDesignRepository> _mockRepository = null!;
        private Mock<ILogger<CustomDesignService>> _mockLogger = null!;
        private CustomDesignService _service = null!;

        [SetUp]
        public void Setup()
        {
            _mockRepository = new Mock<ICustomDesignRepository>();
            _mockLogger = new Mock<ILogger<CustomDesignService>>();
            _service = new CustomDesignService(_mockRepository.Object, _mockLogger.Object);
        }

        [Test]
        public async Task CreateDesignAsync_ValidData_ReturnsDesignId()
        {
            // Arrange
            var designDto = new CustomDesignCreateDto
            {
                Name = "Test Design",
                UserId = "user123",
                FrontImage = "data:image/png;base64,...",
                BackImage = "data:image/png;base64,..."
            };
            
            var expectedId = 1;
            _mockRepository.Setup(r => r.CreateDesignAsync(It.IsAny<CustomDesignCreateDto>()))
                .ReturnsAsync(expectedId);

            // Act
            var result = await _service.CreateDesignAsync(designDto);

            // Assert
            Assert.That(result, Is.EqualTo(expectedId));
            _mockRepository.Verify(r => r.CreateDesignAsync(designDto), Times.Once);
        }

        [Test]
        public void CreateDesignAsync_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            var designDto = new CustomDesignCreateDto
            {
                Name = "Invalid Design",
                UserId = "user123",
                FrontImage = "invalid data",
                BackImage = "invalid data"
            };
            
            _mockRepository.Setup(r => r.CreateDesignAsync(It.IsAny<CustomDesignCreateDto>()))
                .ThrowsAsync(new ArgumentException("Invalid image data"));

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(async () => 
                await _service.CreateDesignAsync(designDto));

            Debug.Assert(ex != null, nameof(ex) + " != null");
            Assert.That(ex.Message, Is.EqualTo("Invalid image data"));
        }

        [Test]
        public async Task GetDesignsByUserIdAsync_UserHasDesigns_ReturnsDesignList()
        {
            // Arrange
            const string userId = "user123";
            var expectedDesigns = new List<CustomDesignDto>
            {
                new()
                {
                    Id = 1,
                    Name = "Design 1",
                    UserId = userId,
                    CreatedAt = DateTime.Now.AddDays(-5)
                },
                new()
                {
                    Id = 2,
                    Name = "Design 2",
                    UserId = userId,
                    CreatedAt = DateTime.Now.AddDays(-1)
                }
            };
            
            _mockRepository.Setup(r => r.GetDesignsByUserIdAsync(userId))
                .ReturnsAsync(expectedDesigns);

            // Act
            var result = await _service.GetDesignsByUserIdAsync(userId);

            // Assert
            Assert.That(result.Count, Is.EqualTo(2));
            Assert.That(result, Is.EqualTo(expectedDesigns));
            _mockRepository.Verify(r => r.GetDesignsByUserIdAsync(userId), Times.Once);
        }

        [Test]
        public async Task GetDesignsByUserIdAsync_UserHasNoDesigns_ReturnsEmptyList()
        {
            // Arrange
            const string userId = "userWithNoDesigns";
            var emptyList = new List<CustomDesignDto>();
            
            _mockRepository.Setup(r => r.GetDesignsByUserIdAsync(userId))
                .ReturnsAsync(emptyList);

            // Act
            var result = await _service.GetDesignsByUserIdAsync(userId);

            // Assert
            Assert.That(result.Count, Is.EqualTo(0));
            _mockRepository.Verify(r => r.GetDesignsByUserIdAsync(userId), Times.Once);
        }

        [Test]
        public void GetDesignsByUserIdAsync_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            const string userId = "invalidUser";
            
            _mockRepository.Setup(r => r.GetDesignsByUserIdAsync(userId))
                .ThrowsAsync(new Exception("Database error"));

            // Act & Assert
            var ex = Assert.ThrowsAsync<Exception>(async () => 
                await _service.GetDesignsByUserIdAsync(userId));

            Debug.Assert(ex != null, nameof(ex) + " != null");
            Assert.That(ex.Message, Is.EqualTo("Database error"));
        }

        [Test]
        public async Task GetDesignByIdAsync_ExistingDesign_ReturnsDesign()
        {
            // Arrange
            const int designId = 1;
            var expectedDesign = new CustomDesignDto
            {
                Id = designId,
                Name = "Test Design",
                UserId = "user123",
                CreatedAt = DateTime.Now.AddDays(-3)
            };
            
            _mockRepository.Setup(r => r.GetDesignByIdAsync(designId))
                .ReturnsAsync(expectedDesign);

            // Act
            var result = await _service.GetDesignByIdAsync(designId);

            // Assert
            Assert.IsNotNull(result);
            Assert.That(result, Is.EqualTo(expectedDesign));
            _mockRepository.Verify(r => r.GetDesignByIdAsync(designId), Times.Once);
        }

        [Test]
        public async Task GetDesignByIdAsync_NonExistingDesign_ReturnsNull()
        {
            // Arrange
            const int designId = 999;
            
            _mockRepository.Setup(r => r.GetDesignByIdAsync(designId))
                .ReturnsAsync((CustomDesignDto)null!);

            // Act
            var result = await _service.GetDesignByIdAsync(designId);

            // Assert
            Assert.IsNull(result);
            _mockRepository.Verify(r => r.GetDesignByIdAsync(designId), Times.Once);
        }

        [Test]
        public void GetDesignByIdAsync_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            const int designId = -1;
            
            _mockRepository.Setup(r => r.GetDesignByIdAsync(designId))
                .ThrowsAsync(new ArgumentException("Invalid design ID"));

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(async () => 
                await _service.GetDesignByIdAsync(designId));

            Debug.Assert(ex != null, nameof(ex) + " != null");
            Assert.That(ex.Message, Is.EqualTo("Invalid design ID"));
        }

        [Test]
        public Task DeleteDesignAsync_ExistingDesign_CompletesSuccessfully()
        {
            // Arrange
            const int designId = 1;
            
            _mockRepository.Setup(r => r.DeleteDesignAsync(designId))
                .Returns(Task.CompletedTask);

            // Act & Assert
            Assert.DoesNotThrowAsync(async () => await _service.DeleteDesignAsync(designId));
            _mockRepository.Verify(r => r.DeleteDesignAsync(designId), Times.Once);
            return Task.CompletedTask;
        }

        [Test]
        public void DeleteDesignAsync_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            const int designId = 999;
            
            _mockRepository.Setup(r => r.DeleteDesignAsync(designId))
                .ThrowsAsync(new Exception("Design not found"));

            // Act & Assert
            var ex = Assert.ThrowsAsync<Exception>(async () => 
                await _service.DeleteDesignAsync(designId));

            Debug.Assert(ex != null, nameof(ex) + " != null");
            Assert.That(ex.Message, Is.EqualTo("Design not found"));
        }
    }
} 