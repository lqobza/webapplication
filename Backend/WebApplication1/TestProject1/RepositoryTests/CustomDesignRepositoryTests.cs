using System.Data;
using System.Data.SqlClient;
using Moq;
using NUnit.Framework;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories;
using WebApplication1.Repositories.Interface;

namespace TestProject1.RepositoryTests;

[TestFixture]
public class CustomDesignRepositoryTests
{
    private Mock<IDatabaseWrapper> _mockDatabase = null!;
    private CustomDesignRepository _repository = null!;
    private Mock<IDataReader> _mockReader = null!;

    [SetUp]
    public void Setup()
    {
        _mockDatabase = new Mock<IDatabaseWrapper>();
        _mockReader = new Mock<IDataReader>();

        _repository = new CustomDesignRepository(_mockDatabase.Object);
    }

    [Test]
    public async Task CreateDesignAsync_ValidDesign_ReturnsDesignId()
    {
        // Arrange
        var designCreateDto = new CustomDesignCreateDto
        {
            UserId = "user123",
            Name = "Test Design",
            FrontImage = "front.jpg",
            BackImage = "back.jpg"
        };

        _mockDatabase.Setup(x => x.ExecuteScalar(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        var result = await _repository.CreateDesignAsync(designCreateDto);

        // Assert
        Assert.That(result, Is.EqualTo(1));
        _mockDatabase.Verify(x => x.ExecuteScalar(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@userId" && (string)param.Value == designCreateDto.UserId) &&
            p.Any(param => param.ParameterName == "@name" && (string)param.Value == designCreateDto.Name))), 
            Times.Once);
    }

    [Test]
    public void CreateDesignAsync_NullResult_ThrowsException()
    {
        // Arrange
        var designCreateDto = new CustomDesignCreateDto
        {
            UserId = "user123",
            Name = "Test Design",
            FrontImage = "front.jpg",
            BackImage = "back.jpg"
        };

        _mockDatabase.Setup(x => x.ExecuteScalar(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(null);

        // Act & Assert
        Assert.ThrowsAsync<InvalidOperationException>(async () => await _repository.CreateDesignAsync(designCreateDto));
    }

    [Test]
    public async Task GetDesignsByUserIdAsync_ReturnsDesignList()
    {
        // Arrange
        const string userId = "user123";

        _mockReader.SetupSequence(x => x.Read())
            .Returns(true)
            .Returns(true)
            .Returns(false);

        _mockReader.Setup(x => x["id"]).Returns(1);
        _mockReader.Setup(x => x["user_id"]).Returns(userId);
        _mockReader.Setup(x => x["name"]).Returns("Test Design");
        _mockReader.Setup(x => x["front_image"]).Returns("front.jpg");
        _mockReader.Setup(x => x["back_image"]).Returns("back.jpg");
        _mockReader.Setup(x => x["created_at"]).Returns(DateTime.Now);

        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Act
        var result = await _repository.GetDesignsByUserIdAsync(userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].UserId, Is.EqualTo(userId));
        Assert.That(result[0].Name, Is.EqualTo("Test Design"));
    }

    [Test]
    public async Task GetDesignByIdAsync_ExistingDesign_ReturnsDesign()
    {
        // Arrange
        const int designId = 1;
        const string userId = "user123";

        _mockReader.SetupSequence(x => x.Read())
            .Returns(true)
            .Returns(false);

        _mockReader.Setup(x => x["id"]).Returns(designId);
        _mockReader.Setup(x => x["user_id"]).Returns(userId);
        _mockReader.Setup(x => x["name"]).Returns("Test Design");
        _mockReader.Setup(x => x["front_image"]).Returns("front.jpg");
        _mockReader.Setup(x => x["back_image"]).Returns("back.jpg");
        _mockReader.Setup(x => x["created_at"]).Returns(DateTime.Now);

        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Act
        var result = await _repository.GetDesignByIdAsync(designId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(designId));
        Assert.That(result.UserId, Is.EqualTo(userId));
        Assert.That(result.Name, Is.EqualTo("Test Design"));
    }

    [Test]
    public async Task GetDesignByIdAsync_NonExistentDesign_ReturnsNull()
    {
        // Arrange
        const int designId = 999;

        _mockReader.Setup(x => x.Read()).Returns(false);

        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Act
        var result = await _repository.GetDesignByIdAsync(designId);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task DeleteDesignAsync_CallsExecuteNonQuery()
    {
        // Arrange
        const int designId = 1;

        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        await _repository.DeleteDesignAsync(designId);

        // Assert
        _mockDatabase.Verify(x => x.ExecuteNonQuery(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@id" && (int)param.Value == designId))), 
            Times.Once);
    }
} 