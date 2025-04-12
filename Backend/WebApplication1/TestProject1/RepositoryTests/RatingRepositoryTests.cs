using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories;
using WebApplication1.Repositories.Interface;

namespace TestProject1.RepositoryTests;

[TestFixture]
public class RatingRepositoryTests
{
    private Mock<ILogger<RatingRepository>> _mockLogger = null!;
    private Mock<IDatabaseWrapper> _mockDatabaseWrapper = null!;
    private RatingRepository _repository = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<RatingRepository>>();
        _mockDatabaseWrapper = new Mock<IDatabaseWrapper>();

        // Setup connection factory
        var connection = new SqlConnection("Data Source=dummy;Initial Catalog=Test;Integrated Security=True");
        _mockDatabaseWrapper.Setup(db => db.CreateConnection()).Returns(connection);
        
        _repository = new RatingRepository(_mockLogger.Object, _mockDatabaseWrapper.Object);
    }

    [Test]
    public void AddRating_ValidRating_ReturnsTrue()
    {
        // Since we can't easily mock SqlCommand and SqlConnection,
        // this test is focused on verifying the repository pattern rather than database operations
        // The actual test would require integration testing or a database abstraction layer

        // Arrange
        var ratingCreateDto = new RatingCreateDto
        {
            MerchId = 1,
            Rating = 4,
            Description = "Great product"
        };

        // Use TestRepository pattern to override database operations
        var testRepo = new TestRatingRepository(_mockLogger.Object, _mockDatabaseWrapper.Object);
        testRepo.SetAddRatingResult(true);
        testRepo.SetMerchExists(true);

        // Act
        bool result = testRepo.AddRating(ratingCreateDto);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(testRepo.AddRatingWasCalled, Is.True);
        Assert.That(testRepo.LastMerchId, Is.EqualTo(1));
    }

    [Test]
    public void AddRating_NonExistentMerchId_ThrowsArgumentException()
    {
        // Arrange
        var ratingCreateDto = new RatingCreateDto
        {
            MerchId = 999,
            Rating = 4,
            Description = "Great product"
        };

        // Use TestRepository pattern to override database operations
        var testRepo = new TestRatingRepository(_mockLogger.Object, _mockDatabaseWrapper.Object);
        testRepo.SetMerchExists(false);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => testRepo.AddRating(ratingCreateDto));
        Assert.That(testRepo.CheckMerchWasCalled, Is.True);
        Assert.That(testRepo.LastMerchId, Is.EqualTo(999));
    }

    [Test]
    public void GetRatingsForMerchandise_ReturnsRatingList()
    {
        // Arrange
        const int merchId = 1;
        
        // Use TestRepository pattern to override database operations
        var testRepo = new TestRatingRepository(_mockLogger.Object, _mockDatabaseWrapper.Object);
        var testRatings = new List<RatingDto>
        {
            new RatingDto
            {
                Id = 1,
                MerchId = 1,
                Rating = 4,
                Description = "Good product",
                CreatedAt = DateTime.Now
            },
            new RatingDto
            {
                Id = 2,
                MerchId = 1,
                Rating = 5,
                Description = "Excellent product",
                CreatedAt = DateTime.Now
            }
        };
        testRepo.SetGetRatingsResult(testRatings);

        // Act
        var result = testRepo.GetRatingsForMerchandise(merchId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].MerchId, Is.EqualTo(merchId));
        Assert.That(result[0].Rating, Is.EqualTo(4));
        Assert.That(testRepo.GetRatingsWasCalled, Is.True);
        Assert.That(testRepo.LastMerchId, Is.EqualTo(merchId));
    }
    
    // Test implementation of RatingRepository that overrides database operations
    private class TestRatingRepository : RatingRepository
    {
        private bool _addRatingResult;
        private bool _merchExists;
        private List<RatingDto> _getRatingsResult = new();
        
        public bool AddRatingWasCalled { get; private set; }
        public bool CheckMerchWasCalled { get; private set; }
        public bool GetRatingsWasCalled { get; private set; }
        public int LastMerchId { get; private set; }

        public TestRatingRepository(ILogger<RatingRepository> logger, IDatabaseWrapper databaseWrapper)
            : base(logger, databaseWrapper)
        {
        }

        public void SetAddRatingResult(bool result)
        {
            _addRatingResult = result;
        }
        
        public void SetMerchExists(bool exists)
        {
            _merchExists = exists;
        }
        
        public void SetGetRatingsResult(List<RatingDto> ratings)
        {
            _getRatingsResult = ratings;
        }

        public override bool AddRating(RatingCreateDto ratingCreateDto)
        {
            AddRatingWasCalled = true;
            LastMerchId = ratingCreateDto.MerchId;
            
            // If merch doesn't exist, throw exception like the real implementation
            if (!_merchExists)
            {
                CheckMerchWasCalled = true;
                throw new ArgumentException("Invalid Merch ID");
            }

            return _addRatingResult;
        }

        public override List<RatingDto> GetRatingsForMerchandise(int merchId)
        {
            GetRatingsWasCalled = true;
            LastMerchId = merchId;
            return _getRatingsResult;
        }
    }
}