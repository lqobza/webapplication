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
public class OrderRepositoryTests
{
    private Mock<ILogger<OrderRepository>> _mockLogger = null!;
    private Mock<IDatabaseWrapper> _mockDatabase = null!;
    private OrderRepository _repository = null!;
    private Mock<IDataReader> _mockReader = null!;
    private Mock<IDbTransaction> _mockTransaction = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<OrderRepository>>();
        _mockDatabase = new Mock<IDatabaseWrapper>();
        _mockReader = new Mock<IDataReader>();
        _mockTransaction = new Mock<IDbTransaction>();

        _repository = new OrderRepository(_mockLogger.Object, _mockDatabase.Object);
    }

    [Test]
    public async Task InsertOrderAsync_ReturnsOrderId()
    {
        // Arrange
        var orderCreateDto = new OrderCreateDto
        {
            CustomerName = "Test Customer",
            CustomerEmail = "test@example.com",
            CustomerAddress = "123 Test St",
            UserId = 123
        };
        decimal totalAmount = 100.00m;

        _mockDatabase.Setup(x => x.ExecuteScalar(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        var result = await _repository.InsertOrderAsync(orderCreateDto, totalAmount);

        // Assert
        Assert.That(result, Is.EqualTo(1));
        _mockDatabase.Verify(x => x.ExecuteScalar(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@totalAmount" && (decimal)param.Value == totalAmount) &&
            p.Any(param => param.ParameterName == "@customerName" && (string)param.Value == orderCreateDto.CustomerName))), 
            Times.Once);
    }

    [Test]
    public async Task InsertOrderItemAsync_ExecutesNonQuery()
    {
        // Arrange
        const int orderId = 1;
        var orderItemDto = new OrderItemDto
        {
            MerchId = 2,
            Size = "M",
            Quantity = 1,
            Price = 50.00m,
            MerchandiseName = "Test Item",
            ImageUrl = "test.jpg",
            IsCustom = false
        };

        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        await _repository.InsertOrderItemAsync(orderId, orderItemDto);

        // Assert
        _mockDatabase.Verify(x => x.ExecuteNonQuery(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@orderId" && (int)param.Value == orderId) &&
            p.Any(param => param.ParameterName == "@quantity" && (int)param.Value == orderItemDto.Quantity))), 
            Times.Once);
    }

    [Test]
    public async Task UpdateStockAsync_WithSufficientStock_UpdatesStock()
    {
        // Arrange
        var orderItemDto = new OrderItemDto
        {
            MerchId = 2,
            Size = "M",
            Quantity = 1
        };

        _mockDatabase.Setup(x => x.ExecuteScalar(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(10); // Current stock is 10

        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(1);

        // Act
        await _repository.UpdateStockAsync(orderItemDto);

        // Assert
        _mockDatabase.Verify(x => x.ExecuteNonQuery(It.IsAny<string>(), It.Is<SqlParameter[]>(p => 
            p.Any(param => param.ParameterName == "@merchId" && (int)param.Value == orderItemDto.MerchId) &&
            p.Any(param => param.ParameterName == "@quantity" && (int)param.Value == orderItemDto.Quantity))), 
            Times.Once);
    }

    [Test]
    public async Task GetAllOrdersAsync_ReturnsOrderList()
    {
        // Arrange
        _mockReader.SetupSequence(x => x.Read())
            .Returns(true)
            .Returns(false);

        _mockReader.Setup(x => x["id"]).Returns(1);
        _mockReader.Setup(x => x["order_date"]).Returns(DateTime.Now);
        _mockReader.Setup(x => x["total_amount"]).Returns(100.00m);
        _mockReader.Setup(x => x["customer_name"]).Returns("Test Customer");
        _mockReader.Setup(x => x["customer_email"]).Returns("test@example.com");
        _mockReader.Setup(x => x["customer_address"]).Returns("123 Test St");
        _mockReader.Setup(x => x["status"]).Returns("Created");

        _mockDatabase.Setup(x => x.ExecuteReader(It.IsAny<string>(), It.IsAny<SqlParameter[]>()))
            .Returns(_mockReader.Object);

        // Mock the GetOrderItemsByIdAsync method
        var itemsReader = new Mock<IDataReader>();
        itemsReader.Setup(x => x.Read()).Returns(false);
        _mockDatabase.Setup(x => x.ExecuteReader(It.Is<string>(s => s.Contains("OrderItems")), It.IsAny<SqlParameter[]>()))
            .Returns(itemsReader.Object);

        // Act
        var result = await _repository.GetAllOrdersAsync();

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].Id, Is.EqualTo(1));
        Assert.That(result[0].CustomerName, Is.EqualTo("Test Customer"));
    }

    [Test]
    public async Task DeleteOrderAsync_SuccessfulDeletion_CommitsTransaction()
    {
        // Arrange
        const int orderId = 1;

        _mockDatabase.Setup(x => x.BeginTransactionAsync())
            .ReturnsAsync(_mockTransaction.Object);

        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>(), It.IsAny<IDbTransaction>()))
            .Returns(1);

        // Act
        await _repository.DeleteOrderAsync(orderId);

        // Assert
        _mockTransaction.Verify(x => x.Commit(), Times.Once);
    }

    [Test]
    public void DeleteOrderAsync_ExceptionThrown_RollbacksTransaction()
    {
        // Arrange
        const int orderId = 1;

        _mockDatabase.Setup(x => x.BeginTransactionAsync())
            .ReturnsAsync(_mockTransaction.Object);

        _mockDatabase.Setup(x => x.ExecuteNonQuery(It.IsAny<string>(), It.IsAny<SqlParameter[]>(), It.IsAny<IDbTransaction>()))
            .Throws(new Exception("Test exception"));

        // Act & Assert
        Assert.ThrowsAsync<Exception>(async () => await _repository.DeleteOrderAsync(orderId));
        _mockTransaction.Verify(x => x.Rollback(), Times.Once);
    }
} 