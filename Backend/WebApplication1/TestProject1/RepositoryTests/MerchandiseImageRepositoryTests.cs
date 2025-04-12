using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories;
using WebApplication1.Repositories.Interface;

namespace TestProject1.RepositoryTests;

[TestFixture]
public class MerchandiseImageRepositoryTests
{
    private Mock<ILogger<MerchandiseImageRepository>> _mockLogger = null!;
    private Mock<IDatabaseWrapper> _mockDb = null!;
    private MerchandiseImageRepository _repository = null!;
    private Mock<IDataReader> _mockReader = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<MerchandiseImageRepository>>();
        _mockDb = new Mock<IDatabaseWrapper>();
        _mockReader = new Mock<IDataReader>();
        
        _repository = new MerchandiseImageRepository(_mockLogger.Object, _mockDb.Object);
    }

    [Test]
    public async Task GetImagesForMerchandise_ReturnsListOfImages()
    {
        // Arrange
        const int merchandiseId = 1;
        
        // Setup the mock reader to return sample data
        _mockReader.SetupSequence(r => r.Read())
            .Returns(true)  // First call returns true
            .Returns(true)  // Second call returns true
            .Returns(false); // Third call returns false to end the loop
        
        _mockReader.Setup(r => r["id"]).Returns(1);
        _mockReader.Setup(r => r["MerchId"]).Returns(merchandiseId);
        _mockReader.Setup(r => r["ImageUrl"]).Returns("http://example.com/image.jpg");
        _mockReader.Setup(r => r["IsPrimary"]).Returns(true);
        _mockReader.Setup(r => r["CreatedAt"]).Returns(DateTime.Now);
        
        _mockDb.Setup(db => db.ExecuteReader(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Act
        var result = await _repository.GetImagesForMerchandise(merchandiseId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2)); // Reader returns true twice
        
        // Verify the database was called with correct parameters
        _mockDb.Verify(db => db.ExecuteReader(
            It.Is<string>(s => s.Contains("SELECT id, MerchId, ImageUrl, IsPrimary, CreatedAt")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@MerchandiseId" && 
                (int)p[0].Value == merchandiseId)
        ), Times.Once);
    }

    [Test]
    public async Task AddImage_ValidData_ReturnsNewImage()
    {
        // Arrange
        const int merchandiseId = 1;
        const string imageUrl = "http://example.com/newimage.jpg";
        const bool isPrimary = true;
        
        // Mock the merchandise existence check
        _mockDb.Setup(db => db.ExecuteScalar(
            It.Is<string>(s => s.Contains("SELECT COUNT(1)")),
            It.IsAny<SqlParameter[]>()))
            .Returns(1); // Merchandise exists
        
        // Mock the reader for the insert operation
        _mockReader.Setup(r => r.Read()).Returns(true);
        _mockReader.Setup(r => r["Id"]).Returns(5);
        _mockReader.Setup(r => r["MerchId"]).Returns(merchandiseId);
        _mockReader.Setup(r => r["ImageUrl"]).Returns(imageUrl);
        _mockReader.Setup(r => r["IsPrimary"]).Returns(isPrimary);
        _mockReader.Setup(r => r["CreatedAt"]).Returns(DateTime.Now);
        
        _mockDb.Setup(db => db.ExecuteReader(
            It.Is<string>(s => s.Contains("INSERT INTO MerchandiseImages")),
            It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Act
        var result = await _repository.AddImage(merchandiseId, imageUrl, isPrimary);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(5));
        Assert.That(result.MerchandiseId, Is.EqualTo(merchandiseId));
        Assert.That(result.ImageUrl, Is.EqualTo(imageUrl));
        Assert.That(result.IsPrimary, Is.EqualTo(isPrimary));
        
        // Verify the update of existing primary images was called
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("UPDATE MerchandiseImages") && 
                           s.Contains("SET IsPrimary = 0")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 &&
                p[0].ParameterName == "@MerchId" && 
                (int)p[0].Value == merchandiseId)
        ), Times.Once);
    }

    [Test]
    public void AddImage_MerchandiseDoesNotExist_ThrowsKeyNotFoundException()
    {
        // Arrange
        const int merchandiseId = 999;
        const string imageUrl = "http://example.com/newimage.jpg";
        
        // Mock the merchandise existence check
        _mockDb.Setup(db => db.ExecuteScalar(
            It.Is<string>(s => s.Contains("SELECT COUNT(1)")),
            It.IsAny<SqlParameter[]>()))
            .Returns(0); // Merchandise does not exist

        // Act & Assert
        var exception = Assert.ThrowsAsync<KeyNotFoundException>(async () => 
            await _repository.AddImage(merchandiseId, imageUrl));
        
        Assert.That(exception.Message, Does.Contain($"Merchandise with ID {merchandiseId} does not exist"));
    }

    [Test]
    public async Task DeleteImage_ExistingId_ReturnsTrue()
    {
        // Arrange
        const int imageId = 1;
        
        // Setup ExecuteNonQuery to return 1 (indicating success)
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        var result = await _repository.DeleteImage(imageId);

        // Assert
        Assert.That(result, Is.True);
        
        // Verify the correct query was executed
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("DELETE FROM MerchandiseImages")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@ImageId" && 
                (int)p[0].Value == imageId)
        ), Times.Once);
    }

    [Test]
    public async Task DeleteImage_NonExistentId_ReturnsFalse()
    {
        // Arrange
        const int imageId = 999;
        
        // Setup ExecuteNonQuery to return 0 (indicating no rows affected)
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(0);

        // Act
        var result = await _repository.DeleteImage(imageId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task SetPrimaryImage_ValidIds_ReturnsTrue()
    {
        // Arrange
        const int merchandiseId = 1;
        const int imageId = 2;
        
        // Setup ExecuteNonQuery for the update query to return 1 (indicating success)
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 1")),
            It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        var result = await _repository.SetPrimaryImage(merchandiseId, imageId);

        // Assert
        Assert.That(result, Is.True);
        
        // Verify reset query was executed
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 0")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@MerchId" && 
                (int)p[0].Value == merchandiseId)
        ), Times.Once);
        
        // Verify update query was executed
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 1")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 2 && 
                p[0].ParameterName == "@ImageId" && 
                (int)p[0].Value == imageId &&
                p[1].ParameterName == "@MerchId" && 
                (int)p[1].Value == merchandiseId)
        ), Times.Once);
    }

    [Test]
    public async Task SetPrimaryImage_NonExistentImage_ReturnsFalse()
    {
        // Arrange
        const int merchandiseId = 1;
        const int imageId = 999;
        
        // Setup ExecuteNonQuery for the update query to return 0 (indicating no rows affected)
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 1")),
            It.IsAny<SqlParameter[]>()))
            .Returns(0);

        // Act
        var result = await _repository.SetPrimaryImage(merchandiseId, imageId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void GetMerchandiseImages_ReturnsListOfImages()
    {
        // Arrange
        const int merchandiseId = 1;
        
        // Setup the mock reader to return sample data
        _mockReader.SetupSequence(r => r.Read())
            .Returns(true)  // First call returns true
            .Returns(true)  // Second call returns true
            .Returns(false); // Third call returns false to end the loop
        
        _mockReader.Setup(r => r["id"]).Returns(1);
        _mockReader.Setup(r => r["MerchId"]).Returns(merchandiseId);
        _mockReader.Setup(r => r["ImageUrl"]).Returns("http://example.com/image.jpg");
        _mockReader.Setup(r => r["IsPrimary"]).Returns(true);
        
        _mockDb.Setup(db => db.ExecuteReader(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Act
        var result = _repository.GetMerchandiseImages(merchandiseId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2)); // Reader returns true twice
        
        // Verify the database was called with correct parameters
        _mockDb.Verify(db => db.ExecuteReader(
            It.Is<string>(s => s.Contains("SELECT id, MerchId, ImageUrl, IsPrimary, CreatedAt")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@MerchandiseId" && 
                (int)p[0].Value == merchandiseId)
        ), Times.Once);
    }

    [Test]
    public void GetMerchandiseImages_ExceptionThrown_ReturnsEmptyList()
    {
        // Arrange
        const int merchandiseId = 1;
        
        // Setup the database to throw an exception
        _mockDb.Setup(db => db.ExecuteReader(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Throws(new Exception("Database error"));

        // Act
        var result = _repository.GetMerchandiseImages(merchandiseId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
        
        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once
        );
    }
} 