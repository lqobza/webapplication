using Microsoft.Extensions.Configuration;
using System.Text;
using WebApplication1.Services;

namespace TestProject1.ServiceTests
{
    [TestFixture]
    public class ImageStorageServiceTests
    {
        private Mock<IConfiguration> _mockConfiguration = null!;
        private FileSystemImageService _imageService = null!;
        private string _testImageDirectory = null!;

        [SetUp]
        public void Setup()
        {
            // Create a temp directory for test images
            _testImageDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(_testImageDirectory);
            
            // Setup Configuration mock
            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(x => x["ImageStorage:Path"]).Returns(_testImageDirectory);
            
            // Create FileSystemImageService with test configuration
            _imageService = new FileSystemImageService(_mockConfiguration.Object);
        }

        [TearDown]
        public void TearDown()
        {
            // Clean up created test directories after each test
            if (Directory.Exists(_testImageDirectory))
            {
                Directory.Delete(_testImageDirectory, true);
            }
        }

        [Test]
        public void GetImageDirectory_ReturnsConfiguredDirectory()
        {
            // Act
            var result = _imageService.GetImageDirectory();
            
            // Assert
            Assert.That(result, Is.EqualTo(_testImageDirectory));
        }
        
        [Test]
        public void GetImageDirectory_DefaultDirectory_WhenConfigurationIsNull()
        {
            // Arrange
            _mockConfiguration.Setup(x => x["ImageStorage:Path"]).Returns((string)null!);
            var serviceWithNullConfig = new FileSystemImageService(_mockConfiguration.Object);
            var expectedDefaultPath = "wwwroot/images/merchandise";
            
            // Act
            var result = serviceWithNullConfig.GetImageDirectory();
            
            // Assert
            Assert.That(result, Does.EndWith(expectedDefaultPath));
        }

        [Test]
        public async Task SaveImageAsync_ValidImage_CreatesDirectoryAndSavesFile()
        {
            // Arrange
            const string merchandiseId = "123";
            const string fileContent = "This is a test image content";
            var mockFile = CreateMockFormFile(fileContent, "test.jpg");
            
            // Act
            var result = await _imageService.SaveImageAsync(mockFile, merchandiseId);
            
            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result, Does.StartWith("/images/merchandise/123/"));
            Assert.That(result, Does.EndWith(".jpg"));
            
            // Verify directory was created
            var merchPath = Path.Combine(_testImageDirectory, merchandiseId);
            Assert.That(Directory.Exists(merchPath), Is.True);
            
            // Verify at least one file exists in the directory
            var files = Directory.GetFiles(merchPath);
            Assert.That(files.Length, Is.EqualTo(1));
            
            // Verify file content
            var savedFileContent = await File.ReadAllTextAsync(files[0]);
            Assert.That(savedFileContent, Is.EqualTo(fileContent));
        }

        [Test]
        public async Task DeleteImageAsync_ExistingImage_DeletesFile()
        {
            // Arrange
            const string merchandiseId = "456";
            const string testFileName = "test_delete.jpg";
            var merchPath = Path.Combine(_testImageDirectory, merchandiseId);
            Directory.CreateDirectory(merchPath);
            
            // Create a test file
            var testFilePath = Path.Combine(merchPath, testFileName);
            await File.WriteAllTextAsync(testFilePath, "Test file content");
            
            // The path format that would be passed to DeleteImageAsync
            var imageRelativePath = $"/images/merchandise/{merchandiseId}/{testFileName}";
            
            // Act
            await _imageService.DeleteImageAsync(imageRelativePath);
            
            // Assert
            Assert.That(File.Exists(testFilePath), Is.False);
        }

        [Test]
        public Task DeleteImageAsync_NonExistentImage_DoesNothing()
        {
            // Arrange
            const string imageRelativePath = "/images/merchandise/999/nonexistent.jpg";
            
            // Act & Assert
            Assert.DoesNotThrowAsync(async () => await _imageService.DeleteImageAsync(imageRelativePath));
            return Task.CompletedTask;
        }

        [Test]
        public Task DeleteImageAsync_InvalidPath_DoesNothing()
        {
            // Arrange - Path that doesn't start with the expected prefix
            const string invalidPath = "/invalid/path/image.jpg";

            // Act & Assert
            Assert.DoesNotThrowAsync(async () => await _imageService.DeleteImageAsync(invalidPath));
            return Task.CompletedTask;
        }

        private static IFormFile CreateMockFormFile(string content, string fileName)
        {
            // Convert content to bytes
            var bytes = Encoding.UTF8.GetBytes(content);
            
            // Create a memory stream with the content
            var stream = new MemoryStream(bytes);
            
            // Create a mock form file
            var mockFormFile = new Mock<IFormFile>();
            mockFormFile.Setup(f => f.FileName).Returns(fileName);
            mockFormFile.Setup(f => f.Length).Returns(bytes.Length);
            mockFormFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Callback<Stream, CancellationToken>((s, _) => 
                {
                    stream.Seek(0, SeekOrigin.Begin);
                    stream.CopyTo(s);
                })
                .Returns(Task.CompletedTask);
            
            return mockFormFile.Object;
        }
    }
} 