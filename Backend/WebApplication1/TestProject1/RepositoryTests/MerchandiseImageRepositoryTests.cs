using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
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
    public async Task GetImagesForMerchandiseRetursListOfImages()
    {
        //Arrange
        const int merchandiseId = 1;
        _mockReader.SetupSequence(r => r.Read())
            .Returns(true)  //first  
            .Returns(true)   //second call
            .Returns(false); //third call
        
        _mockReader.Setup(r => r["id"]).Returns(1);
        _mockReader.Setup(r => r["MerchId"]).Returns(merchandiseId);
        _mockReader.Setup(r => r["ImageUrl"]).Returns("http://example.com/image.jpg");
        _mockReader.Setup(r => r["IsPrimary"]).Returns(true);
        _mockReader.Setup(r => r["CreatedAt"]).Returns(DateTime.Now);
        _mockDb.Setup(db => db.ExecuteReader(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        
        //Act 
        var result = await _repository.GetImagesForMerchandise(merchandiseId);

        //Asert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2)); 
        
        _mockDb.Verify(db => db.ExecuteReader(
            It.Is<string>(s => s.Contains("SELECT id, MerchId, ImageUrl, IsPrimary, CreatedAt")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@MerchandiseId" && 
                (int)p[0].Value == merchandiseId)
        ), Times.Once);
    }
    

    [Test]
    public async Task AddImageValidDataReturnsNewImage()
    {
        //Arrange
        const int merchandiseId = 1;
        const string imageUrl = "http://example.com/newimage.jpg";
        const bool isPrimary = true;
        
        _mockDb.Setup(db => db.ExecuteScalar(
            It.Is<string>(s => s.Contains("SELECT COUNT(1)")),
            It.IsAny<SqlParameter[]>()))
            .Returns(1);
        
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

        //Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(5));
        Assert.That(result.MerchandiseId, Is.EqualTo(merchandiseId));
        Assert.That(result.ImageUrl, Is.EqualTo(imageUrl));
        Assert.That(result.IsPrimary, Is.EqualTo(isPrimary));
        
        
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
    public void AddImageMerchandiseDoesNotExistThrowsKeyNotFoundEx()
    {
        //Arrange
        const int merchandiseId = 999;
        const string imageUrl ="http://example.com/newimage.jpg";
        
        _mockDb.Setup(db=>db.ExecuteScalar(
            It.Is<string>(s => s.Contains("SELECT COUNT(1)")),
            It.IsAny<SqlParameter[]>()))
            .Returns(0);

        //Act, Assert
        var exception = Assert.ThrowsAsync<KeyNotFoundException>(async () =>  
            await _repository.AddImage(merchandiseId, imageUrl));
        
        Assert.That(exception?.Message, Does.Contain($"Merchandise with ID {merchandiseId} does not exist"));
    }

    [Test]
    public async Task DeleteImageExistingIdReturnsTrue()
    {
        //Arrange
        const int imageID = 1;
        
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(1);

        //Act
        var result =await _repository.DeleteImage(imageID);

        //Assert
        Assert.That(result, Is.True);
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("DELETE FROM MerchandiseImages")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@ImageId" && 
                (int)p[0].Value == imageID)
        ), Times.Once);
        
    }

    [Test]
    public async Task DeleteImageNonExistentIDReturnsFalse()
    {
        //Arrange
        const int imageId = 999;
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(0);

        //Act
        var result = await _repository.DeleteImage(imageId);

        //Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task SetPrimaryImageValidIdsReturnsTrue()
    {
        //Arrange
        const int merchandiseId = 1;
        const int imageId = 2;
        
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 1")),
            It.IsAny<SqlParameter[]>()))
            .Returns(1);
        //Act
        var result = await _repository.SetPrimaryImage(merchandiseId, imageId);

        
        //Assert
        Assert.That(result, Is.True);
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 0")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@MerchId" && 
                (int)p[0].Value == merchandiseId)
        ), Times.Once);
        
        
        _mockDb.Verify(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 1")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 2 && 
                p[0].ParameterName == "@ImageId"&& 
                (int)p[0].Value == imageId &&
                p[1].ParameterName == "@MerchId"&&
                (int)p[1].Value == merchandiseId)
        ),Times.Once);
    }

    [Test]
    public async Task SetPrimaryImageNonExistentImageReturnsFalse()
    {
        //Arrange
        const int merchandiseId = 1;
        const int imageId = 999; 
        _mockDb.Setup(db => db.ExecuteNonQuery(
            It.Is<string>(s => s.Contains("SET IsPrimary = 1")),
            It.IsAny<SqlParameter[]>()))
            .Returns(0);

        //Act
        var result = await _repository.SetPrimaryImage(merchandiseId, imageId);

        
        //Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void GetMerchandiseImagesReturnsListOfImages()
    {
        
        //Arrangee
        const int merchandiseID = 1;
        
        _mockReader.SetupSequence(r => r.Read())
            .Returns(true)
            .Returns(true)
            .Returns(false);
        
        _mockReader.Setup(r => r["id"]).Returns(1);
        _mockReader.Setup(r => r["MerchId"]).Returns(merchandiseID);
        _mockReader.Setup(r => r["ImageUrl"]).Returns("http://example.com/image.jpg");
        _mockReader.Setup(r => r["IsPrimary"]).Returns(true);
        _mockDb.Setup(db => db.ExecuteReader(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        //Act
        var result = _repository.GetMerchandiseImages(merchandiseID);

        //Assert
        Assert.That(result, Is.Not.Null);
        
        Assert.That(result.Count, Is.EqualTo(2));
        
        _mockDb.Verify(db => db.ExecuteReader(
            It.Is<string>(s => s.Contains("SELECT id, MerchId, ImageUrl, IsPrimary, CreatedAt")),
            It.Is<SqlParameter[]>(p => 
                p.Length == 1 && 
                p[0].ParameterName == "@MerchandiseId" && 
                (int)p[0].Value == merchandiseID)
        ), Times.Once);
    }

    [Test]
    public void GetMerchandiseImagesExceptionThrownReturnsEmptyList()
    {
        //Arrange
        const int merchandiseId = 1;
        _mockDb.Setup(db => db.ExecuteReader(
            It.IsAny<string>(), 
            It.IsAny<SqlParameter[]>()))
            .Throws(new Exception("Database error"));
        // Act
        var result = _repository.GetMerchandiseImages(merchandiseId);

        //Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
        
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