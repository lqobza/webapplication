using System.Diagnostics;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;
using Newtonsoft.Json;

namespace TestProject1.ControllerTests;

[TestFixture]
public class MerchandiseControllerTests
{
    private Mock<IMerchandiseService> _mockMerchandiseService = null!;
    private Mock<ILogger<MerchandiseController>> _mockLogger = null!;
    private Mock<IImageStorageService> _mockImageStorageService = null!;
    private Mock<IMerchandiseRepository> _mockMerchandiseRepository = null!;
    private MerchandiseController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _mockMerchandiseService = new Mock<IMerchandiseService>();
        _mockLogger = new Mock<ILogger<MerchandiseController>>();
        _mockImageStorageService = new Mock<IImageStorageService>();
        _mockMerchandiseRepository = new Mock<IMerchandiseRepository>();

        _controller = new MerchandiseController(
            _mockMerchandiseService.Object,
            _mockLogger.Object,
            _mockImageStorageService.Object,
            _mockMerchandiseRepository.Object
        );
    }
    
    [Test]
    public void GetAllMerchandise_ValidParameters_ReturnsOkWithItems()
    {
        // Arrange
        const int page = 1;
        const int pageSize = 10;
        var expectedResult = new PaginatedResponse<MerchandiseDto>
        {
            Items = new List<MerchandiseDto> { new() { Id = 1, Name = "Test Merchandise" } },
            TotalCount = 1,
            PageNumber = page,
            PageSize = pageSize,
            TotalPages = 1,
            HasNextPage = false,
            HasPreviousPage = false
        };
        
        _mockMerchandiseService.Setup(s => s.GetAllMerchandise(page, pageSize)).Returns(expectedResult);
        
        // Act
        var result = _controller.GetAllMerchandise(page, pageSize);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Debug.Assert(okResult != null, nameof(okResult) + " != null");
        Assert.That(okResult.Value, Is.EqualTo(expectedResult));
    }
    
    [Test]
    public void GetAllMerchandise_InvalidParameters_ReturnsBadRequest()
    {
        // Arrange
        const int page = 0;
        const int pageSize = 0;
        
        // Act
        var result = _controller.GetAllMerchandise(page, pageSize);
        
        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }
    
    [Test]
    public void GetAllMerchandise_EmptyResult_ReturnsNotFound()
    {
        // Arrange
        const int page = 1;
        const int pageSize = 10;
        var emptyResult = new PaginatedResponse<MerchandiseDto>
        {
            Items = new List<MerchandiseDto>(),
            TotalCount = 0,
            PageNumber = page,
            PageSize = pageSize,
            TotalPages = 0
        };
        
        _mockMerchandiseService.Setup(s => s.GetAllMerchandise(page, pageSize)).Returns(emptyResult);
        
        // Act
        var result = _controller.GetAllMerchandise(page, pageSize);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public void GetMerchandiseById_ExistingId_ReturnsOkWithItem()
    {
        // Arrange
        const int id = 1;
        var expectedMerchandise = new MerchandiseDto { Id = id, Name = "Test Merchandise" };
        
        _mockMerchandiseService.Setup(s => s.GetMerchandiseById(id)).Returns(expectedMerchandise);
        
        // Act
        var result = _controller.GetMerchandiseById(id);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Debug.Assert(okResult != null, nameof(okResult) + " != null");
        Assert.That(okResult.Value, Is.EqualTo(expectedMerchandise));
    }
    
    [Test]
    public void GetMerchandiseById_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        const int id = 999;
        _mockMerchandiseService.Setup(s => s.GetMerchandiseById(id)).Returns((MerchandiseDto)null!);
        
        // Act
        var result = _controller.GetMerchandiseById(id);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public void GetMerchandiseBySize_ExistingSize_ReturnsOkWithItems()
    {
        // Arrange
        const string size = "L";
        var expectedItems = new List<MerchandiseDto> { new MerchandiseDto { Id = 1, Name = "Test Merchandise" } };
        
        _mockMerchandiseService.Setup(s => s.GetMerchandiseBySize(size)).Returns(expectedItems);
        
        // Act
        var result = _controller.GetMerchandiseBySize(size);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Debug.Assert(okResult != null, nameof(okResult) + " != null");
        Assert.That(okResult.Value, Is.EqualTo(expectedItems));
    }
    
    [Test]
    public void GetMerchandiseBySize_EmptySize_ReturnsBadRequest()
    {
        // Arrange
        const string size = "";
        
        // Act
        var result = _controller.GetMerchandiseBySize(size);
        
        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }
    
    [Test]
    public void GetMerchandiseBySize_NonExistingSize_ReturnsNotFound()
    {
        // Arrange
        const string size = "XXL";
        _mockMerchandiseService.Setup(s => s.GetMerchandiseBySize(size)).Returns(new List<MerchandiseDto>());
        
        // Act
        var result = _controller.GetMerchandiseBySize(size);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public void GetMerchandiseByCategory_ExistingCategory_ReturnsOkWithItems()
    {
        // Arrange
        const int category = 1;
        var expectedItems = new List<MerchandiseDto> { new MerchandiseDto { Id = 1, Name = "Test Merchandise" } };
        
        _mockMerchandiseService.Setup(s => s.GetMerchandiseByCategory(category)).Returns(expectedItems);
        
        // Act
        var result = _controller.GetMerchandiseByCategory(category);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Debug.Assert(okResult != null, nameof(okResult) + " != null");
        Assert.That(okResult.Value, Is.EqualTo(expectedItems));
    }
    
    [Test]
    public void GetMerchandiseByCategory_NonExistingCategory_ReturnsNotFound()
    {
        // Arrange
        const int category = 999;
        _mockMerchandiseService.Setup(s => s.GetMerchandiseByCategory(category)).Returns(new List<MerchandiseDto>());
        
        // Act
        var result = _controller.GetMerchandiseByCategory(category);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public void DeleteMerchandiseById_ExistingId_ReturnsNoContent()
    {
        // Arrange
        const int id = 1;
        _mockMerchandiseService.Setup(s => s.DeleteMerchandiseById(id)).Returns(true);
        
        // Act
        var result = _controller.DeleteMerchandiseById(id);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }
    
    [Test]
    public void DeleteMerchandiseById_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        const int id = 999;
        _mockMerchandiseService.Setup(s => s.DeleteMerchandiseById(id)).Returns(false);
        
        // Act
        var result = _controller.DeleteMerchandiseById(id);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public void InsertMerchandise_ValidData_ReturnsOk()
    {
        // Arrange
        var merchandiseDto = new MerchandiseCreateDto 
        { 
            Name = "New Merchandise",
            CategoryId = 1,
            BrandId = 1
        };
        
        _mockMerchandiseService.Setup(s => s.InsertMerchandise(merchandiseDto))
            .Returns(InsertResult.Success);
        
        // Act
        var result = _controller.InsertMerchandise(merchandiseDto);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }
    
    [Test]
    public void InsertMerchandise_AlreadyExists_ReturnsConflict()
    {
        // Arrange
        var merchandiseDto = new MerchandiseCreateDto
        {
            Name = "Existing Merchandise",
            CategoryId = 1,
            BrandId = 1
        };
        
        _mockMerchandiseService.Setup(s => s.InsertMerchandise(merchandiseDto))
            .Returns(InsertResult.AlreadyExists);
        
        // Act
        var result = _controller.InsertMerchandise(merchandiseDto);
        
        // Assert
        Assert.That(result, Is.InstanceOf<ConflictObjectResult>());
    }
    
    [Test]
    public void UpdateMerchandise_ValidData_ReturnsOk()
    {
        // Arrange
        const int id = 1;
        var updateDto = new MerchandiseUpdateDto
        {
            Description = "Updated Merchandise",
            Price = 20
        };
        
        _mockMerchandiseService.Setup(s => s.UpdateMerchandise(id, updateDto)).Returns(true);
        
        // Act
        var result = _controller.UpdateMerchandise(id, updateDto);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }
    
    [Test]
    public void UpdateMerchandise_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        const int id = 999;
        var updateDto = new MerchandiseUpdateDto
        {
            Description = "Updated Merchandise",
            Price = 20
        };
        
        _mockMerchandiseService.Setup(s => s.UpdateMerchandise(id, updateDto)).Returns(false);
        
        // Act
        var result = _controller.UpdateMerchandise(id, updateDto);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public void GetSizesByCategoryId_ExistingCategory_ReturnsOkWithSizes()
    {
        // Arrange
        const int categoryId = 1;
        var expectedSizes = new List<string> { "S", "M", "L" };
        
        _mockMerchandiseService.Setup(s => s.GetSizesByCategoryId(categoryId)).Returns(expectedSizes);
        
        // Act
        var result = _controller.GetSizesByCategoryId(categoryId);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Debug.Assert(okResult != null, nameof(okResult) + " != null");
        Assert.That(okResult.Value, Is.EqualTo(expectedSizes));
    }
    
    [Test]
    public void GetSizesByCategoryId_NonExistingCategory_ReturnsNotFound()
    {
        // Arrange
        const int categoryId = 999;
        _mockMerchandiseService.Setup(s => s.GetSizesByCategoryId(categoryId)).Returns((List<string>)null!);
        
        // Act
        var result = _controller.GetSizesByCategoryId(categoryId);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
    
    [Test]
    public Task CheckStockAvailability_ValidParameters_ReturnsOkWithAvailability()
    {
        // Arrange
        const int id = 1;
        const string size = "M";
        const int quantity = 2;
        
        var merchandise = new MerchandiseDto { Id = id, Name = "Test Merchandise", CategoryId = 1 };
        var sizes = new List<string> { "S", "M", "L" };
        var merchSizes = new List<MerchSizeDto> 
        { 
            new() { MerchId = id, Size = "M", InStock = 5 } 
        };
        
        _mockMerchandiseService.Setup(s => s.GetMerchandiseById(id)).Returns(merchandise);
        _mockMerchandiseService.Setup(s => s.GetSizesByCategoryId(merchandise.CategoryId)).Returns(sizes);
        _mockMerchandiseRepository.Setup(r => r.GetSizesByMerchId(id)).Returns(merchSizes);
        
        // Act
        var result = _controller.CheckStockAvailability(id, size, quantity);
        
        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        
        // Convert to JSON and then deserialize to access properties safely
        Debug.Assert(okResult != null, nameof(okResult) + " != null");
        var json = JsonConvert.SerializeObject(okResult.Value);
        var deserialized = JsonConvert.DeserializeObject<dynamic>(json);
        
        Assert.That(deserialized, Is.Not.Null);
        Assert.That((bool)deserialized!.isAvailable, Is.True);
        Assert.That((int)deserialized.available, Is.EqualTo(5));
        Assert.That((int)deserialized.requested, Is.EqualTo(quantity));
        return Task.CompletedTask;
    }
    
    [Test]
    public void CheckStockAvailability_NonExistingMerchandise_ReturnsNotFound()
    {
        // Arrange
        const int id = 999;
        const string size = "M";
        
        _mockMerchandiseService.Setup(s => s.GetMerchandiseById(id)).Returns((MerchandiseDto)null!);
        
        // Act
        var result = _controller.CheckStockAvailability(id, size);
        
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
}