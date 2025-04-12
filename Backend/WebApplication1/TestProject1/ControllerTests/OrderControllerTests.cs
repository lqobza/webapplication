using System.Diagnostics;
using System.Security.Claims;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Services.Interface;

namespace TestProject1.ControllerTests
{
    [TestFixture]
    public class OrderControllerTests
    {
        private Mock<IOrderService> _mockOrderService = null!;
        private Mock<ILogger<OrderController>> _mockLogger = null!;
        private OrderController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _mockOrderService = new Mock<IOrderService>();
            _mockLogger = new Mock<ILogger<OrderController>>();
            _controller = new OrderController(_mockOrderService.Object, _mockLogger.Object);
            
            // Create default HttpContext to simulate authentication
            var httpContext = new DefaultHttpContext();
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }

        private void SetupUserContext(bool isAdmin = false, int userId = 1)
        {
            var claims = new List<Claim> { new Claim("userId", userId.ToString()) };

            if (isAdmin)
            {
                claims.Add(new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "Admin"));
            }
            
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext.HttpContext.User = claimsPrincipal;
        }
        
        [Test]
        public async Task GetAllOrders_AsAdmin_ReturnsOkWithOrders()
        {
            // Arrange
            SetupUserContext(isAdmin: true);
            
            var expectedOrders = new List<OrderDto>
            {
                new() { Id = 1, Status = "Created" },
                new() { Id = 2, Status = "Processing" }
            };
            
            _mockOrderService.Setup(s => s.GetAllOrdersAsync())
                .ReturnsAsync(expectedOrders);
            
            // Act
            var result = await _controller.GetAllOrders();
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(expectedOrders));
        }
        
        [Test]
        public async Task GetAllOrders_AsNonAdmin_ReturnsUnauthorized()
        {
            // Arrange
            SetupUserContext(isAdmin: false);
            
            // Act
            var result = await _controller.GetAllOrders();
            
            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }
        
        [Test]
        public async Task GetOrdersByUserId_ValidUser_ReturnsOkWithOrders()
        {
            // Arrange
            const int userId = 1;
            SetupUserContext(isAdmin: false, userId: userId);
            
            var expectedOrders = new List<OrderDto>
            {
                new() { Id = 1, CustomerName = "User " + userId, Status = "Created" },
                new() { Id = 2, CustomerName = "User " + userId, Status = "Processing" }
            };
            
            _mockOrderService.Setup(s => s.GetOrdersByUserIdAsync(userId))
                .ReturnsAsync(expectedOrders);
            
            // Act
            var result = await _controller.GetOrdersByUserId();
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(expectedOrders));
        }
        
        [Test]
        public async Task GetOrdersByUserId_NoOrders_ReturnsNoContent()
        {
            // Arrange
            const int userId = 1;
            SetupUserContext(isAdmin: false, userId: userId);
            
            _mockOrderService.Setup(s => s.GetOrdersByUserIdAsync(userId))
                .ReturnsAsync(new List<OrderDto>());
            
            // Act
            var result = await _controller.GetOrdersByUserId();
            
            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }
        
        [Test]
        public async Task GetOrderById_ExistingOrder_ReturnsOkWithOrder()
        {
            // Arrange
            const int orderId = 1;
            var expectedOrder = new OrderDto { Id = orderId, Status = "Created" };
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync(expectedOrder);
            
            // Act
            var result = await _controller.GetOrderById(orderId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(expectedOrder));
        }
        
        [Test]
        public async Task GetOrderById_NonExistingOrder_ReturnsNotFound()
        {
            // Arrange
            const int orderId = 999;
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync((OrderDto)null!);
            
            // Act
            var result = await _controller.GetOrderById(orderId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
        
        [Test]
        public async Task CreateOrder_ValidData_ReturnsOk()
        {
            // Arrange
            var orderCreateDto = new OrderCreateDto
            {
                Items = new List<OrderItemDto>
                {
                    new() { MerchId = 1, Size = "M", Quantity = 2, IsCustom = false }
                }
            };
            
            _mockOrderService.Setup(s => s.CreateOrderAsync(orderCreateDto))
                .ReturnsAsync(InsertResult.Success);
            
            // Act
            var result = await _controller.CreateOrder(orderCreateDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }
        
        [Test]
        public async Task CreateOrder_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var orderCreateDto = new OrderCreateDto();
            _controller.ModelState.AddModelError("Items", "At least one item is required");
            
            // Act
            var result = await _controller.CreateOrder(orderCreateDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task CreateOrder_NoValidItems_ReturnsBadRequest()
        {
            // Arrange
            var orderCreateDto = new OrderCreateDto
            {
                Items = new List<OrderItemDto>
                {
                    new() { MerchId = null, Size = "M", IsCustom = false }
                }
            };
            
            // Act
            var result = await _controller.CreateOrder(orderCreateDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task CreateOrder_InsufficientStock_ReturnsBadRequest()
        {
            // Arrange
            var orderCreateDto = new OrderCreateDto
            {
                Items = new List<OrderItemDto>
                {
                    new() { MerchId = 1, Size = "M", Quantity = 10, IsCustom = false }
                }
            };
            
            _mockOrderService.Setup(s => s.CreateOrderAsync(orderCreateDto))
                .ThrowsAsync(new InvalidOperationException("Insufficient stock for item 'Test Product' size M, requested: 10, available: 5"));
            
            // Act
            var result = await _controller.CreateOrder(orderCreateDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task CancelOrder_ExistingCreatedOrder_ReturnsOk()
        {
            // Arrange
            const int orderId = 1;
            var order = new OrderDto { Id = orderId, Status = "Created" };
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync(order);
            
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(orderId, "Cancelled"))
                .Returns(Task.CompletedTask);
            
            // Act
            var result = await _controller.CancelOrder(orderId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }
        
        [Test]
        public async Task CancelOrder_NonExistingOrder_ReturnsNotFound()
        {
            // Arrange
            const int orderId = 999;
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync((OrderDto)null!);
            
            // Act
            var result = await _controller.CancelOrder(orderId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
        
        [Test]
        public async Task CancelOrder_CompletedOrder_ReturnsBadRequest()
        {
            // Arrange
            const int orderId = 1;
            var order = new OrderDto { Id = orderId, Status = "Completed" };
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync(order);
            
            // Act
            var result = await _controller.CancelOrder(orderId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
        
        [Test]
        public async Task UpdateOrderStatus_ValidData_ReturnsOk()
        {
            // Arrange
            const int orderId = 1;
            var statusDto = new UpdateOrderStatusDto { Status = "Processing" };
            var order = new OrderDto { Id = orderId, Status = "Created" };
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync(order);
            
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(orderId, statusDto.Status))
                .Returns(Task.CompletedTask);
            
            // Act
            var result = await _controller.UpdateOrderStatus(orderId, statusDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }
        
        [Test]
        public async Task GetOrderMessages_ExistingOrder_ReturnsOkWithMessages()
        {
            // Arrange
            const int orderId = 1;
            var order = new OrderDto { Id = orderId, Status = "Created" };
            var messages = new List<OrderMessageDto>
            {
                new() { Id = 1, OrderId = orderId, Content = "Test message" }
            };
            
            _mockOrderService.Setup(s => s.GetOrderByIdAsync(orderId))
                .ReturnsAsync(order);
            
            _mockOrderService.Setup(s => s.GetOrderMessagesAsync(orderId))
                .ReturnsAsync(messages);
            
            // Act
            var result = await _controller.GetOrderMessages(orderId);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(messages));
        }
        
        [Test]
        public async Task AddOrderMessage_ValidData_ReturnsOkWithMessage()
        {
            // Arrange
            const int orderId = 1;
            var messageDto = new OrderMessageCreateDto
            {
                OrderId = orderId,
                Content = "Test message",
                IsFromAdmin = false
            };
            
            var createdMessage = new OrderMessageDto
            {
                Id = 1,
                OrderId = orderId,
                Content = "Test message",
                Timestamp = DateTime.Now,
                IsFromAdmin = false
            };
            
            _mockOrderService.Setup(s => s.AddOrderMessageAsync(messageDto))
                .ReturnsAsync(createdMessage);
            
            // Act
            var result = await _controller.AddOrderMessage(orderId, messageDto);
            
            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Debug.Assert(okResult != null, nameof(okResult) + " != null");
            Assert.That(okResult.Value, Is.EqualTo(createdMessage));
        }
    }
}