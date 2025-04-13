using System.Diagnostics;
using System.Security.Claims;
using WebApplication1.Models.DTOs;
using WebApplication1.Services.Interface;
using Newtonsoft.Json;

namespace TestProject1.ControllerTests
{
    [TestFixture]
    public class CustomDesignControllerTests
    {
        private Mock<ICustomDesignService> _mockCustomDesignService = null!;
        private Mock<ILogger<CustomDesignController>> _mockLogger = null!;
        private CustomDesignController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _mockCustomDesignService = new Mock<ICustomDesignService>();
            _mockLogger = new Mock<ILogger<CustomDesignController>>();
            _controller = new CustomDesignController(_mockCustomDesignService.Object, _mockLogger.Object);
            
            var httpContext = new DefaultHttpContext();
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }
        
        private void SetupUserContext(string userId = "user1", bool isAdmin = false)
        {
            var claims = new List<Claim>
            {
                new("userId", userId),
                isAdmin ? new Claim(ClaimTypes.Role, "Admin") : new Claim(ClaimTypes.Role, "User")
            };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext.HttpContext.User = principal;
        }

        [Test]
        public async Task CreateDesign_ValidData_ReturnsOkWithId()
        {
            // Arrange
            var designDto = new CustomDesignCreateDto
            {
                Name = "Test Design",
                UserId = "user1",
                FrontImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
                BackImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
            };
            
            const int expectedDesignId = 1;
            
            _mockCustomDesignService.Setup(s => s.CreateDesignAsync(It.IsAny<CustomDesignCreateDto>()))
                .ReturnsAsync(expectedDesignId);
            
            // Act
            var result = await _controller.CreateDesign(designDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            var json = JsonConvert.SerializeObject(okResult.Value);
            var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
            
            Assert.That(deserialized, Is.Not.Null);
            Assert.That((int)deserialized!.Id, Is.EqualTo(expectedDesignId));
        }
        
        [Test]
        public async Task CreateDesign_NullData_ReturnsBadRequest()
        {
            // Arrange
            CustomDesignCreateDto designDto = null!;
            
            // Act
            var result = await _controller.CreateDesign(designDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task CreateDesign_MissingRequiredFields_ReturnsBadRequest()
        {
            // Arrange
            var designDto1 = new CustomDesignCreateDto
            {
                Name = "",
                UserId = "user1",
                FrontImage = "data:image/png;base64,...",
                BackImage = "data:image/png;base64,..."
            };
            
            // Act
            var result1 = await _controller.CreateDesign(designDto1);
            
            // Assert
            Assert.That(result1, Is.InstanceOf<BadRequestObjectResult>());
            
            // Arrange - UserId missing
            var designDto2 = new CustomDesignCreateDto
            {
                Name = "Test Design",
                UserId = "",
                FrontImage = "data:image/png;base64,...",
                BackImage = "data:image/png;base64,..."
            };
            
            // Act
            var result2 = await _controller.CreateDesign(designDto2);
            
            // Assert
            Assert.That(result2, Is.InstanceOf<BadRequestObjectResult>());
            
            // Arrange - FrontImage missing
            var designDto3 = new CustomDesignCreateDto
            {
                Name = "Test Design",
                UserId = "user1",
                FrontImage = "",
                BackImage = "data:image/png;base64,..."
            };
            
            // Act
            var result3 = await _controller.CreateDesign(designDto3);
            
            // Assert
            Assert.That(result3, Is.InstanceOf<BadRequestObjectResult>());
            
            // Arrange - BackImage missing
            var designDto4 = new CustomDesignCreateDto
            {
                Name = "Test Design",
                UserId = "user1",
                FrontImage = "data:image/png;base64,...",
                BackImage = ""
            };
            
            // Act
            var result4 = await _controller.CreateDesign(designDto4);
            
            // Assert
            Assert.That(result4, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task CreateDesign_ServiceException_ReturnsInternalServerError()
        {
            // Arrange
            var designDto = new CustomDesignCreateDto
            {
                Name = "Test Design",
                UserId = "user1",
                FrontImage = "data:image/png;base64,...",
                BackImage = "data:image/png;base64,..."
            };
            
            _mockCustomDesignService.Setup(s => s.CreateDesignAsync(designDto))
                .ThrowsAsync(new Exception("Database error"));
            
            // Act
            var result = await _controller.CreateDesign(designDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var statusCodeResult = result as ObjectResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
        }
        
        [Test]
        public async Task GetDesignsByUserId_ValidUser_ReturnsOkWithDesigns()
        {
            // Arrange
            const string userId = "user1";
            var expectedDesigns = new List<CustomDesignDto>
            {
                new()
                {
                    Id = 1,
                    Name = "Test Design 1",
                    UserId = userId
                },
                new()
                {
                    Id = 2,
                    Name = "Test Design 2",
                    UserId = userId
                }
            };
            
            _mockCustomDesignService.Setup(s => s.GetDesignsByUserIdAsync(userId))
                .ReturnsAsync(expectedDesigns);
            
            // Act
            var result = await _controller.GetDesignsByUserId(userId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(expectedDesigns));
        }
        
        [Test]
        public async Task GetDesignsByUserId_EmptyUserId_ReturnsBadRequest()
        {
            // Arrange
            const string userId = "";
            
            // Act
            var result = await _controller.GetDesignsByUserId(userId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task GetDesignsByUserId_ServiceException_ReturnsInternalServerError()
        {
            // Arrange
            const string userId = "user1";
            
            _mockCustomDesignService.Setup(s => s.GetDesignsByUserIdAsync(userId))
                .ThrowsAsync(new Exception("Database error"));
            
            // Act
            var result = await _controller.GetDesignsByUserId(userId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var statusCodeResult = result as ObjectResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
        }
        
        [Test]
        public async Task GetDesignById_ExistingDesign_ReturnsOkWithDesign()
        {
            // Arrange
            const int designId = 1;
            var expectedDesign = new CustomDesignDto
            {
                Id = designId,
                Name = "Test Design",
                UserId = "user1"
            };
            
            _mockCustomDesignService.Setup(s => s.GetDesignByIdAsync(designId))
                .ReturnsAsync(expectedDesign);
            
            // Act
            var result = await _controller.GetDesignById(designId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(expectedDesign));
        }
        
        [Test]
        public async Task GetDesignById_NonExistingDesign_ReturnsNotFound()
        {
            // Arrange
            const int designId = 999;
            
            _mockCustomDesignService.Setup(s => s.GetDesignByIdAsync(designId))
                .ReturnsAsync((CustomDesignDto)null!);
            
            // Act
            var result = await _controller.GetDesignById(designId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
        
        [Test]
        public async Task DeleteDesign_OwnerUser_ReturnsNoContent()
        {
            // Arrange
            const int designId = 1;
            const string userId = "user1";
            
            SetupUserContext(userId);
            
            var design = new CustomDesignDto
            {
                Id = designId,
                Name = "Test Design",
                UserId = userId
            };
            
            _mockCustomDesignService.Setup(s => s.GetDesignByIdAsync(designId))
                .ReturnsAsync(design);
            
            _mockCustomDesignService.Setup(s => s.DeleteDesignAsync(designId))
                .Returns(Task.CompletedTask);
            
            // Act
            var result = await _controller.DeleteDesign(designId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }
        
        [Test]
        public async Task DeleteDesign_NonExistingDesign_ReturnsNotFound()
        {
            // Arrange
            const int designId = 999;
            
            _mockCustomDesignService.Setup(s => s.GetDesignByIdAsync(designId))
                .ReturnsAsync((CustomDesignDto)null!);
            
            // Act
            var result = await _controller.DeleteDesign(designId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
        
        [Test]
        public async Task DeleteDesign_NonOwnerUser_ReturnsForbidden()
        {
            // Arrange
            const int designId = 1;
            const string userId = "user1";
            const string otherUserId = "user2";
            
            SetupUserContext(otherUserId);
            
            var design = new CustomDesignDto
            {
                Id = designId,
                Name = "Test Design",
                UserId = userId  // Different from the current user
            };
            
            _mockCustomDesignService.Setup(s => s.GetDesignByIdAsync(designId))
                .ReturnsAsync(design);
            
            // Act
            var result = await _controller.DeleteDesign(designId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var statusCodeResult = result as ObjectResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(403));
        }
    }
} 