using System.Diagnostics;
using WebApplication1.Models.DTOs;
using WebApplication1.Services.Interface;
using Newtonsoft.Json;

namespace TestProject1.ControllerTests
{
    [TestFixture]
    public class AuthControllerTests
    {
        private Mock<IAuthService> _mockAuthService = null!;
        private Mock<ILogger<AuthController>> _mockLogger = null!;
        private AuthController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _mockAuthService = new Mock<IAuthService>();
            _mockLogger = new Mock<ILogger<AuthController>>();
            _controller = new AuthController(_mockAuthService.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Register_ValidUser_ReturnsOkWithToken()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "Password123!",
                Username = "testuser"
            };

            const string expectedToken = "valid-jwt-token";
            _mockAuthService.Setup(s => s.RegisterUserAsync(registerDto))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;

            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.Not.Null);
            
            // Convert to JSON and deserialize to safely access properties
            var json = JsonConvert.SerializeObject(okResult.Value);
            var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
            
            Assert.That(deserialized, Is.Not.Null);
            Assert.That((string)deserialized!.Token, Is.EqualTo(expectedToken));
        }

        [Test]
        public async Task Register_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "invalid-email",
                Password = "short",
                Username = ""
            };

            _controller.ModelState.AddModelError("Email", "Invalid email format");
            _controller.ModelState.AddModelError("Password", "Password must be at least 8 characters");
            _controller.ModelState.AddModelError("Username", "Username is required");

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Register_DuplicateEmail_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "existing@example.com",
                Password = "Password123!",
                Username = "testuser"
            };

            _mockAuthService.Setup(s => s.RegisterUserAsync(registerDto))
                .ThrowsAsync(new ArgumentException("User with this email already exists"));

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;

            Debug.Assert(badRequestResult != null, nameof(badRequestResult) + " != null");
            Assert.That(badRequestResult.Value, Is.Not.Null);
            
            // Convert to JSON and deserialize to safely access properties
            var json = JsonConvert.SerializeObject(badRequestResult.Value);
            var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
            
            Assert.That(deserialized, Is.Not.Null);
            Assert.That((string)deserialized!.Message, Is.EqualTo("User with this email already exists"));
        }

        [Test]
        public async Task Register_UnexpectedException_ReturnsInternalServerError()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "Password123!",
                Username = "testuser"
            };

            _mockAuthService.Setup(s => s.RegisterUserAsync(registerDto))
                .ThrowsAsync(new Exception("Database connection error"));

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var statusCodeResult = result as ObjectResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
        }

        [Test]
        public async Task Login_ValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            const string expectedToken = "valid-jwt-token";
            _mockAuthService.Setup(s => s.LoginAsync(loginDto))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;

            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.Not.Null);
            
            // Convert to JSON and deserialize to safely access properties
            var json = JsonConvert.SerializeObject(okResult.Value);
            var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
            
            Assert.That(deserialized, Is.Not.Null);
            Assert.That((string)deserialized!.Token, Is.EqualTo(expectedToken));
        }

        [Test]
        public async Task Login_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "invalid-email",
                Password = ""
            };

            _controller.ModelState.AddModelError("Email", "Invalid email format");
            _controller.ModelState.AddModelError("Password", "Password is required");

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Login_InvalidCredentials_ReturnsBadRequest()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            _mockAuthService.Setup(s => s.LoginAsync(loginDto))
                .ThrowsAsync(new ArgumentException("Invalid email or password"));

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;

            Debug.Assert(badRequestResult != null, nameof(badRequestResult) + " != null");
            Assert.That(badRequestResult.Value, Is.Not.Null);
            
            // Convert to JSON and deserialize to safely access properties
            var json = JsonConvert.SerializeObject(badRequestResult.Value);
            var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
            
            Assert.That(deserialized, Is.Not.Null);
            Assert.That((string)deserialized!.Message, Is.EqualTo("Invalid email or password"));
        }

        [Test]
        public async Task Login_UnexpectedException_ReturnsInternalServerError()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            _mockAuthService.Setup(s => s.LoginAsync(loginDto))
                .ThrowsAsync(new Exception("Database connection error"));

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var statusCodeResult = result as ObjectResult;
            Debug.Assert(statusCodeResult != null, nameof(statusCodeResult) + " != null");
            Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
        }
    }
} 