using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services;
using WebApplication1.Services.Interface;

namespace TestProject1.ServiceTests;

[TestFixture]
public class MerchandiseServiceTests
{
    private Mock<IMerchandiseRepository> _mockMerchandiseRepository = null!;
    private Mock<IMerchandiseImageRepository> _mockImageRepository = null!;
    private Mock<IImageStorageService> _mockImageStorageService = null!;
    private MerchandiseService _merchandiseService = null!;

    [SetUp]
    public void Setup()
    {
        _mockMerchandiseRepository = new Mock<IMerchandiseRepository>();
        _mockImageRepository = new Mock<IMerchandiseImageRepository>();
        _mockImageStorageService = new Mock<IImageStorageService>();
        _merchandiseService = new MerchandiseService(
            _mockMerchandiseRepository.Object,
            _mockImageRepository.Object,
            _mockImageStorageService.Object);
    }

    [Test]
    public void GetAllMerchandise_ReturnsPaginatedResponse()
    {
        // Arrange
        var expectedResponse = new PaginatedResponse<MerchandiseDto>
        {
            Items = new List<MerchandiseDto>
            {
                new() { Id = 1, Name = "Test Item" }
            },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };
        _mockMerchandiseRepository.Setup(x => x.GetAllMerchandise(1, 10))
            .Returns(expectedResponse);

        // Act
        var result = _merchandiseService.GetAllMerchandise();

        // Assert
        Assert.That(result, Is.EqualTo(expectedResponse));
        _mockMerchandiseRepository.Verify(x => x.GetAllMerchandise(1, 10), Times.Once);
    }

    [Test]
    public void GetMerchandiseById_ExistingId_ReturnsMerchandise()
    {
        // Arrange
        var expectedMerchandise = new MerchandiseDto { Id = 1, Name = "Test Item" };
        _mockMerchandiseRepository.Setup(x => x.GetMerchandiseById(1))
            .Returns(expectedMerchandise);

        // Act
        var result = _merchandiseService.GetMerchandiseById(1);

        // Assert
        Assert.That(result, Is.EqualTo(expectedMerchandise));
        _mockMerchandiseRepository.Verify(x => x.GetMerchandiseById(1), Times.Once);
    }

    [Test]
    public void GetMerchandiseById_NonExistentId_ReturnsNull()
    {
        // Arrange
        _mockMerchandiseRepository.Setup(x => x.GetMerchandiseById(999))
            .Returns((MerchandiseDto?)null);

        // Act
        var result = _merchandiseService.GetMerchandiseById(999);

        // Assert
        Assert.That(result, Is.Null);
        _mockMerchandiseRepository.Verify(x => x.GetMerchandiseById(999), Times.Once);
    }

    [Test]
    public void GetMerchandiseBySize_ValidSize_ReturnsMerchandiseList()
    {
        // Arrange
        var expectedList = new List<MerchandiseDto>
        {
            new() { Id = 1, Name = "Test Item" }
        };
        _mockMerchandiseRepository.Setup(x => x.GetMerchandiseBySize("L"))
            .Returns(expectedList);

        // Act
        var result = _merchandiseService.GetMerchandiseBySize("L");

        // Assert
        Assert.That(result, Is.EqualTo(expectedList));
        _mockMerchandiseRepository.Verify(x => x.GetMerchandiseBySize("L"), Times.Once);
    }

    [Test]
    public void GetMerchandiseBySize_EmptySize_ThrowsArgumentException()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => _merchandiseService.GetMerchandiseBySize(""));
        _mockMerchandiseRepository.Verify(x => x.GetMerchandiseBySize(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public void GetMerchandiseByCategory_ValidCategory_ReturnsMerchandiseList()
    {
        // Arrange
        var expectedList = new List<MerchandiseDto>
        {
            new() { Id = 1, Name = "Test Item" }
        };
        _mockMerchandiseRepository.Setup(x => x.GetMerchandiseByCategory(1))
            .Returns(expectedList);

        // Act
        var result = _merchandiseService.GetMerchandiseByCategory(1);

        // Assert
        Assert.That(result, Is.EqualTo(expectedList));
        _mockMerchandiseRepository.Verify(x => x.GetMerchandiseByCategory(1), Times.Once);
    }

    [Test]
    public void InsertMerchandise_NewMerchandise_ReturnsSuccess()
    {
        // Arrange
        var merchandise = new MerchandiseCreateDto
        {
            CategoryId = 1,
            Name = "New Item",
            Price = 100,
            Description = "Test Description",
            BrandId = 1
        };
        _mockMerchandiseRepository.Setup(x => x.MerchandiseExists(1, "New Item", 1))
            .Returns(false);
        _mockMerchandiseRepository.Setup(x => x.InsertMerchandise(merchandise))
            .Returns(InsertResult.Success);

        // Act
        var result = _merchandiseService.InsertMerchandise(merchandise);

        // Assert
        Assert.That(result, Is.EqualTo(InsertResult.Success));
        _mockMerchandiseRepository.Verify(x => x.MerchandiseExists(1, "New Item", 1), Times.Once);
        _mockMerchandiseRepository.Verify(x => x.InsertMerchandise(merchandise), Times.Once);
    }

    [Test]
    public void InsertMerchandise_ExistingMerchandise_ReturnsAlreadyExists()
    {
        // Arrange
        var merchandise = new MerchandiseCreateDto
        {
            CategoryId = 1,
            Name = "Existing Item",
            Price = 100,
            Description = "Test Description",
            BrandId = 1
        };
        _mockMerchandiseRepository.Setup(x => x.MerchandiseExists(1, "Existing Item", 1))
            .Returns(true);

        // Act
        var result = _merchandiseService.InsertMerchandise(merchandise);

        // Assert
        Assert.That(result, Is.EqualTo(InsertResult.AlreadyExists));
        _mockMerchandiseRepository.Verify(x => x.MerchandiseExists(1, "Existing Item", 1), Times.Once);
        _mockMerchandiseRepository.Verify(x => x.InsertMerchandise(It.IsAny<MerchandiseCreateDto>()), Times.Never);
    }

    [Test]
    public void DeleteMerchandiseById_ExistingId_ReturnsTrue()
    {
        // Arrange
        _mockMerchandiseRepository.Setup(x => x.DeleteMerchandiseById(1))
            .Returns(true);

        // Act
        var result = _merchandiseService.DeleteMerchandiseById(1);

        // Assert
        Assert.That(result, Is.True);
        _mockMerchandiseRepository.Verify(x => x.DeleteMerchandiseById(1), Times.Once);
    }

    [Test]
    public void DeleteMerchandiseById_NonExistentId_ReturnsFalse()
    {
        // Arrange
        _mockMerchandiseRepository.Setup(x => x.DeleteMerchandiseById(999))
            .Returns(false);

        // Act
        var result = _merchandiseService.DeleteMerchandiseById(999);

        // Assert
        Assert.That(result, Is.False);
        _mockMerchandiseRepository.Verify(x => x.DeleteMerchandiseById(999), Times.Once);
    }

    [Test]
    public void UpdateMerchandise_ValidIdAndData_ReturnsTrue()
    {
        // Arrange
        var updateDto = new MerchandiseUpdateDto { Price = 150 };
        _mockMerchandiseRepository.Setup(x => x.UpdateMerchandise(1, updateDto))
            .Returns(true);

        // Act
        var result = _merchandiseService.UpdateMerchandise(1, updateDto);

        // Assert
        Assert.That(result, Is.True);
        _mockMerchandiseRepository.Verify(x => x.UpdateMerchandise(1, updateDto), Times.Once);
    }

    [Test]
    public void UpdateMerchandise_InvalidId_ThrowsArgumentException()
    {
        // Arrange
        var updateDto = new MerchandiseUpdateDto { Price = 150 };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _merchandiseService.UpdateMerchandise(0, updateDto));
        _mockMerchandiseRepository.Verify(x => x.UpdateMerchandise(It.IsAny<int>(), It.IsAny<MerchandiseUpdateDto>()), Times.Never);
    }

    [Test]
    public async Task AddMerchandiseImage_ValidData_ReturnsImageDto()
    {
        // Arrange
        var expectedImage = new MerchandiseImageDto
        {
            Id = 1,
            MerchandiseId = 1,
            ImageUrl = "test.jpg",
            IsPrimary = false
        };
        _mockImageRepository.Setup(x => x.AddImage(1, "test.jpg", false))
            .ReturnsAsync(expectedImage);

        // Act
        var result = await _merchandiseService.AddMerchandiseImage(1, "test.jpg");

        // Assert
        Assert.That(result, Is.EqualTo(expectedImage));
        _mockImageRepository.Verify(x => x.AddImage(1, "test.jpg", false), Times.Once);
    }

    [Test]
    public async Task SetPrimaryImage_ValidData_ReturnsTrue()
    {
        // Arrange
        _mockImageRepository.Setup(x => x.SetPrimaryImage(1, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _merchandiseService.SetPrimaryImage(1, 1);

        // Assert
        Assert.That(result, Is.True);
        _mockImageRepository.Verify(x => x.SetPrimaryImage(1, 1), Times.Once);
    }

    [Test]
    public void GetMerchandiseImages_ValidId_ReturnsImageList()
    {
        // Arrange
        var expectedImages = new List<MerchandiseImageDto>
        {
            new() { Id = 1, MerchandiseId = 1, ImageUrl = "test.jpg" }
        };
        _mockImageRepository.Setup(x => x.GetMerchandiseImages(1))
            .Returns(expectedImages);

        // Act
        var result = _merchandiseService.GetMerchandiseImages(1);

        // Assert
        Assert.That(result, Is.EqualTo(expectedImages));
        _mockImageRepository.Verify(x => x.GetMerchandiseImages(1), Times.Once);
    }

    [Test]
    public void AddCategoryToDb_NewCategory_ReturnsSuccess()
    {
        // Arrange
        var categoryDto = new CategoryCreateDto { Name = "New Category" };
        _mockMerchandiseRepository.Setup(x => x.AddCategoryToDb(categoryDto))
            .Returns(1);

        // Act
        var result = _merchandiseService.AddCategoryToDb(categoryDto);

        // Assert
        Assert.That(result, Is.EqualTo(InsertResult.Success));
        _mockMerchandiseRepository.Verify(x => x.AddCategoryToDb(categoryDto), Times.Once);
    }

    [Test]
    public void AddCategoryToDb_ExistingCategory_ReturnsAlreadyExists()
    {
        // Arrange
        var categoryDto = new CategoryCreateDto { Name = "Existing Category" };
        _mockMerchandiseRepository.Setup(x => x.AddCategoryToDb(categoryDto))
            .Returns(-1);

        // Act
        var result = _merchandiseService.AddCategoryToDb(categoryDto);

        // Assert
        Assert.That(result, Is.EqualTo(InsertResult.AlreadyExists));
        _mockMerchandiseRepository.Verify(x => x.AddCategoryToDb(categoryDto), Times.Once);
    }

    [Test]
    public void AddThemeToDb_NewTheme_ReturnsSuccess()
    {
        // Arrange
        var themeDto = new ThemeCreateDto { Name = "New Theme" };
        _mockMerchandiseRepository.Setup(x => x.AddThemeToDb(themeDto))
            .Returns(1);

        // Act
        var result = _merchandiseService.AddThemeToDb(themeDto);

        // Assert
        Assert.That(result, Is.EqualTo(InsertResult.Success));
        _mockMerchandiseRepository.Verify(x => x.AddThemeToDb(themeDto), Times.Once);
    }

    [Test]
    public void AddThemeToDb_ExistingTheme_ReturnsAlreadyExists()
    {
        // Arrange
        var themeDto = new ThemeCreateDto { Name = "Existing Theme" };
        _mockMerchandiseRepository.Setup(x => x.AddThemeToDb(themeDto))
            .Returns(-1);

        // Act
        var result = _merchandiseService.AddThemeToDb(themeDto);

        // Assert
        Assert.That(result, Is.EqualTo(InsertResult.AlreadyExists));
        _mockMerchandiseRepository.Verify(x => x.AddThemeToDb(themeDto), Times.Once);
    }
} 