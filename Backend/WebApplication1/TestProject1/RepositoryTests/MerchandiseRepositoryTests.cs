using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApplication1.Repositories;
using WebApplication1.Repositories.Interface;

namespace TestProject1.RepositoryTests;

[TestFixture]
public class MerchandiseRepositoryTests
{
    private Mock<IConfiguration> _mockConfiguration = null!;
    private Mock<IConfigurationSection> _mockConnectionStringsSection = null!;
    private Mock<IConfigurationSection> _mockDefaultConnectionSection = null!;
    private Mock<IRatingRepository> _mockRatingRepository = null!;
    private Mock<IDatabaseWrapper> _mockDatabase = null!;
    private MerchandiseRepository _repository = null!;
    private Mock<IDataReader> _mockReader = null!;
    private Mock<ILogger<MerchandiseRepository>> _mockLogger = null!;
    
    [SetUp]
    public void Setup()
    {
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConnectionStringsSection = new Mock<IConfigurationSection>();
        _mockDefaultConnectionSection = new Mock<IConfigurationSection>();
        _mockRatingRepository = new Mock<IRatingRepository>();
        _mockDatabase = new Mock<IDatabaseWrapper>();
        _mockReader = new Mock<IDataReader>();
        _mockLogger = new Mock<ILogger<MerchandiseRepository>>();
        
        // Setup configuration for GetConnectionString to work
        _mockDefaultConnectionSection.Setup(x => x.Value).Returns("Server=test;Database=test;Trusted_Connection=True;");
        _mockConnectionStringsSection.Setup(x => x["DefaultConnection"]).Returns("Server=test;Database=test;Trusted_Connection=True;");
        _mockConfiguration.Setup(x => x.GetSection("ConnectionStrings")).Returns(_mockConnectionStringsSection.Object);

        _repository = new MerchandiseRepository(
            _mockRatingRepository.Object,
            _mockDatabase.Object,
            _mockLogger.Object);
    }

    [Test]
    public void MerchandiseExists_WhenExists_ReturnsTrue()
    {
        // Arrange
        const int categoryId = 1;
        const string name = "Test Merch";
        const int brandId = 1;
        
        _mockDatabase.Setup(x => x.ExecuteScalar(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        var result = _repository.MerchandiseExists(categoryId, name, brandId);

        // Assert
        Assert.That(result, Is.True);
        _mockDatabase.Verify(x => x.ExecuteScalar(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@categoryId" && (int)param.Value == categoryId) &&
            p.Any(param => param.ParameterName == "@name" && (string)param.Value == name) &&
            p.Any(param => param.ParameterName == "@brandId" && (int)param.Value == brandId))), Times.Once);
    }

    [Test]
    public void MerchandiseExists_WhenNotExists_ReturnsFalse()
    {
        // Arrange
        const int categoryId = 1;
        const string name = "Test Merch";
        const int brandId = 1;
        
        _mockDatabase.Setup(x => x.ExecuteScalar(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(0);

        // Act
        var result = _repository.MerchandiseExists(categoryId, name, brandId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void DeleteMerchandiseById_WhenExists_ReturnsTrue()
    {
        // Arrange
        const int id = 1;
        
        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        var result = _repository.DeleteMerchandiseById(id);

        // Assert
        Assert.That(result, Is.True);
        _mockDatabase.Verify(x => x.ExecuteNonQuery(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@id" && (int)param.Value == id))), Times.Once);
    }

    [Test]
    public void DeleteMerchandiseById_WhenNotExists_ReturnsFalse()
    {
        // Arrange
        const int id = 999;
        
        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(0);

        // Act
        var result = _repository.DeleteMerchandiseById(id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void GetMerchandiseBySize_WhenSizeExists_ReturnsList()
    {
        // Arrange
        const string size = "L";
        
        _mockReader.SetupSequence(x => x.Read())
            .Returns(true)
            .Returns(false);
        
        _mockReader.Setup(x => x["id"]).Returns(1);
        _mockReader.Setup(x => x["category_id"]).Returns(1);
        _mockReader.Setup(x => x["CategoryName"]).Returns("Test Category");
        _mockReader.Setup(x => x["name"]).Returns("Test Merch");
        _mockReader.Setup(x => x["price"]).Returns(100);
        _mockReader.Setup(x => x["description"]).Returns("Test Description");
        _mockReader.Setup(x => x["brand_id"]).Returns(1);
        _mockReader.Setup(x => x["BrandName"]).Returns("Test Brand");
        _mockReader.Setup(x => x["theme_id"]).Returns(DBNull.Value);
        
        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);
        
        // Mock the GetImagesForMerchandise method
        _mockDatabase.Setup(x => x.ExecuteReader(It.Is<string>(s => s.Contains("GetImagesByMerchandiseId")), It.IsAny<SqlParameter[]>()))
            .Returns(Mock.Of<IDataReader>(r => r.Read() == false));
            
        // Act
        var result = _repository.GetMerchandiseBySize(size);
        
        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].Name, Is.EqualTo("Test Merch"));
        _mockDatabase.Verify(x => x.ExecuteReader(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@size" && (string)param.Value == size))), Times.Once);
    }
    
    [Test]
    public void GetMerchandiseBySize_WhenSizeDoesNotExist_ReturnsEmptyList()
    {
        // Arrange
        const string size = "XXL";
        
        _mockReader.Setup(x => x.Read()).Returns(false);
        
        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);
        
        // Act
        var result = _repository.GetMerchandiseBySize(size);
        
        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(0));
    }

    [Test]
    public void UpdateMerchandise_WithNonExistingId_ReturnsFalse()
    {
        // Arrange
        const int id = 999;
        var updateDto = new WebApplication1.Models.DTOs.MerchandiseUpdateDto
        {
            Description = "Updated Description",
            Price = 150
        };
        
        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(0);
        
        // Act
        var result = _repository.UpdateMerchandise(id, updateDto);
        
        // Assert
        Assert.That(result, Is.False);
    }
    
    [Test]
    public void GetCategories_ReturnsListOfCategories()
    {
        // Arrange
        _mockReader.SetupSequence(x => x.Read())
            .Returns(true)
            .Returns(true)
            .Returns(false);
        
        _mockReader.Setup(x => x["id"]).Returns(1);
        _mockReader.Setup(x => x["name"]).Returns("Test Category");
        
        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);
        
        // Act
        var result = _repository.GetCategories();
        
        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].Name, Is.EqualTo("Test Category"));
    }
} 