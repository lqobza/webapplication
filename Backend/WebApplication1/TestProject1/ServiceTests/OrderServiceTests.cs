using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services;

namespace TestProject1.ServiceTests;

[TestFixture]
public class OrderServiceTests
{
    private Mock<IOrderRepository> _mockOrderRepository = null!;
    private Mock<ILogger<OrderService>> _mockLogger = null!;
    private OrderService _orderService = null!;

    [SetUp]
    public void Setup()
    {
        _mockOrderRepository = new Mock<IOrderRepository>();
        _mockLogger = new Mock<ILogger<OrderService>>();
        _orderService = new OrderService(_mockOrderRepository.Object, _mockLogger.Object);
    }

    [Test]
    public async Task GetAllOrdersAsync_ReturnsOrderList()
    {
        // Arrange
        var expectedOrders = new List<OrderDto>
        {
            new()
            {
                Id = 1,
                OrderDate = DateTime.UtcNow,
                TotalAmount = 200,
                CustomerName = "Test Customer",
                Status = "Created"
            }
        };

        _mockOrderRepository.Setup(x => x.GetAllOrdersAsync())
            .ReturnsAsync(expectedOrders);

        // Act
        var result = await _orderService.GetAllOrdersAsync();

        // Assert
        Assert.That(result, Is.EqualTo(expectedOrders));
        _mockOrderRepository.Verify(x => x.GetAllOrdersAsync(), Times.Once);
    }

    [Test]
    public async Task GetOrderByIdAsync_ExistingId_ReturnsOrder()
    {
        // Arrange
        var expectedOrder = new OrderDto
        {
            Id = 1,
            OrderDate = DateTime.UtcNow,
            TotalAmount = 200,
            CustomerName = "Test Customer",
            Status = "Created"
        };

        _mockOrderRepository.Setup(x => x.GetOrderByIdAsync(1))
            .ReturnsAsync(expectedOrder);

        // Act
        var result = await _orderService.GetOrderByIdAsync(1);

        // Assert
        Assert.That(result, Is.EqualTo(expectedOrder));
        _mockOrderRepository.Verify(x => x.GetOrderByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetOrderByIdAsync_NonExistentId_ReturnsNull()
    {
        // Arrange
        _mockOrderRepository.Setup(x => x.GetOrderByIdAsync(999))
            .ReturnsAsync((OrderDto?)null);

        // Act
        var result = await _orderService.GetOrderByIdAsync(999);

        // Assert
        Assert.That(result, Is.Null);
        _mockOrderRepository.Verify(x => x.GetOrderByIdAsync(999), Times.Once);
    }

    [Test]
    public async Task UpdateOrderStatusAsync_ValidIdAndStatus_UpdatesStatus()
    {
        // Arrange
        _mockOrderRepository.Setup(x => x.UpdateOrderStatusAsync(1, "Shipped"))
            .Returns(Task.CompletedTask);

        // Act
        await _orderService.UpdateOrderStatusAsync(1, "Shipped");

        // Assert
        _mockOrderRepository.Verify(x => x.UpdateOrderStatusAsync(1, "Shipped"), Times.Once);
    }

    [Test]
    public async Task GetOrdersByUserIdAsync_ValidUserId_ReturnsOrderList()
    {
        // Arrange
        var expectedOrders = new List<OrderDto>
        {
            new()
            {
                Id = 1,
                OrderDate = DateTime.UtcNow,
                TotalAmount = 200,
                CustomerName = "Test Customer",
                Status = "Created"
            }
        };

        _mockOrderRepository.Setup(x => x.GetOrdersByUserIdAsync(1))
            .ReturnsAsync(expectedOrders);

        // Act
        var result = await _orderService.GetOrdersByUserIdAsync(1);

        // Assert
        Assert.That(result, Is.EqualTo(expectedOrders));
        _mockOrderRepository.Verify(x => x.GetOrdersByUserIdAsync(1), Times.Once);
    }

    [Test]
    public async Task AddOrderMessageAsync_ValidMessage_ReturnsMessageDto()
    {
        // Arrange
        var messageDto = new OrderMessageCreateDto
        {
            OrderId = 1,
            Content = "Test message",
            IsFromAdmin = true
        };

        var expectedMessage = new OrderMessageDto
        {
            Id = 1,
            OrderId = 1,
            Content = "Test message",
            IsFromAdmin = true,
            Timestamp = DateTime.UtcNow
        };

        _mockOrderRepository.Setup(x => x.AddOrderMessageAsync(messageDto))
            .ReturnsAsync(expectedMessage);

        // Act
        var result = await _orderService.AddOrderMessageAsync(messageDto);

        // Assert
        Assert.That(result, Is.EqualTo(expectedMessage));
        _mockOrderRepository.Verify(x => x.AddOrderMessageAsync(messageDto), Times.Once);
    }

    [Test]
    public async Task GetOrderMessagesAsync_ValidOrderId_ReturnsMessageList()
    {
        // Arrange
        var expectedMessages = new List<OrderMessageDto>
        {
            new()
            {
                Id = 1,
                OrderId = 1,
                Content = "Test message",
                IsFromAdmin = true,
                Timestamp = DateTime.UtcNow
            }
        };

        _mockOrderRepository.Setup(x => x.GetOrderMessagesAsync(1))
            .ReturnsAsync(expectedMessages);

        // Act
        var result = await _orderService.GetOrderMessagesAsync(1);

        // Assert
        Assert.That(result, Is.EqualTo(expectedMessages));
        _mockOrderRepository.Verify(x => x.GetOrderMessagesAsync(1), Times.Once);
    }
} 