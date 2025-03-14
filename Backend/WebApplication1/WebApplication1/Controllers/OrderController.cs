using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Services.Interface;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    private readonly ILogger<OrderController> _logger;
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService, ILogger<OrderController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllOrders()
    {
        _logger.LogInformation("GetAllOrders endpoint called");

        // Log all claims for debugging
        foreach (var claim in User.Claims)
        {
            _logger.LogInformation("Claim: Type = {ClaimType}, Value = {ClaimValue}", claim.Type, claim.Value);
        }

        // TEMPORARY: Skip admin check for debugging
        // Remove this and uncomment the proper check below when fixed
        //bool isAdmin = true;

        
        // Check for admin role in various possible claim types
        bool isAdmin = User.Claims.Any(c => 
            (c.Type == "Role" && c.Value == "Admin") ||
            (c.Type == "role" && c.Value == "Admin") ||
            (c.Type == ClaimTypes.Role && c.Value == "Admin") ||
            (c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" && c.Value == "Admin") ||
            (c.Type == "roles" && c.Value.Contains("Admin"))
        );
        

        if (!isAdmin)
        {
            _logger.LogWarning("Unauthorized access attempt to GetAllOrders");
            return Unauthorized(new { message = "Admin access required" });
        }

        try
        {
            var orders = await _orderService.GetAllOrdersAsync();
            _logger.LogInformation("Retrieved {Count} orders", orders.Count);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all orders");
            return StatusCode(500, "An error occurred while retrieving orders");
        }
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrdersByUserId()
    {
        _logger.LogInformation("GetOrdersByUserId endpoint called");

        // Try to get user ID from various possible claim types
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId") ??
                          User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier) ??
                          User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        
        if (userIdClaim == null)
        {
            _logger.LogWarning("User ID claim not found in token");
            return Unauthorized(new { message = "User not authenticated or user ID not found in token" });
        }

        if (!int.TryParse(userIdClaim.Value, out int userId))
        {
            _logger.LogWarning("Invalid user ID format in token: {UserId}", userIdClaim.Value);
            return BadRequest(new { message = "Invalid user ID format" });
        }

        _logger.LogInformation("Fetching orders for user ID: {UserId}", userId);
        var orderList = await _orderService.GetOrdersByUserIdAsync(userId);

        if (orderList.Count == 0)
        {
            _logger.LogInformation("No orders found for user ID: {UserId}", userId);
            return NoContent();
        }

        _logger.LogInformation("Returning orders list for user ID: {UserId}", userId);
        return Ok(orderList);
    }

    [HttpGet("orders/{id:int}")]
    public async Task<IActionResult> GetOrderById(int id)
    {
        _logger.LogInformation("GetOrderById endpoint called");

        var order = await _orderService.GetOrderByIdAsync(id);

        if (order == null)
        {
            _logger.LogInformation("Order not found");
            return NotFound(new { message = "Order not found" });
        }

        _logger.LogInformation("Returning order: {id}", id);
        return Ok(order);
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto orderCreateDto)
    {
        _logger.LogInformation("CreateOrder endpoint called");
        
        var orderCreateDtoJson = JsonConvert.SerializeObject(orderCreateDto, Formatting.Indented);
        _logger.LogInformation("Received OrderCreateDto: {OrderCreateDto}", orderCreateDtoJson);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid input data: {ModelStateErrors}", ModelState);
            return BadRequest(ModelState);
        }
        
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid model state for order creation");
            return BadRequest(ModelState);
        }

        var insertResult = await _orderService.CreateOrderAsync(orderCreateDto);

        if (insertResult == InsertResult.Success)
        {
            _logger.LogInformation("Order created successfully: {Order}", orderCreateDtoJson);
            return Ok(new { message = "Order created successfully" });
        }

        if (insertResult == InsertResult.Error)
        {
            _logger.LogError("Internal server error while creating order: {Order}", orderCreateDtoJson);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Order creation failed due to internal server error" });
        }

        _logger.LogError("Unexpected error during order creation");
        return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error" });
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(int id)
    {
        try
        {
            _logger.LogInformation("CancelOrder endpoint called for order {OrderId}", id);
            
            // First check if the order exists
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
            {
                _logger.LogWarning("Order with ID {OrderId} not found", id);
                return NotFound($"Order with ID {id} not found");
            }

            // Check if the order can be cancelled (only Created or Processing orders can be cancelled)
            if (order.Status != "Created" && order.Status != "Processing")
            {
                _logger.LogWarning("Cannot cancel order {OrderId} with status '{Status}'", id, order.Status);
                return BadRequest($"Cannot cancel order with status '{order.Status}'");
            }

            // Update the order status to Cancelled
            await _orderService.UpdateOrderStatusAsync(id, "Cancelled");
            _logger.LogInformation("Order {OrderId} cancelled successfully", id);

            return Ok(new { message = "Order cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling order {OrderId}", id);
            return StatusCode(500, "An error occurred while cancelling the order");
        }
    }
    
    [HttpPost("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto statusDto)
    {
        try
        {
            _logger.LogInformation("UpdateOrderStatus endpoint called for order {OrderId} with status {Status}", id, statusDto.Status);
            
            // First check if the order exists
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
            {
                _logger.LogWarning("Order with ID {OrderId} not found", id);
                return NotFound($"Order with ID {id} not found");
            }

            // Validate the status
            if (string.IsNullOrWhiteSpace(statusDto.Status))
            {
                _logger.LogWarning("Invalid status provided for order {OrderId}", id);
                return BadRequest("Status cannot be empty");
            }

            // Update the order status
            await _orderService.UpdateOrderStatusAsync(id, statusDto.Status);
            _logger.LogInformation("Order {OrderId} status updated to {Status} successfully", id, statusDto.Status);

            return Ok(new { message = $"Order status updated to {statusDto.Status} successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status for order {OrderId}", id);
            return StatusCode(500, "An error occurred while updating the order status");
        }
    }
    
    // Order Messages Endpoints
    
    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetOrderMessages(int id)
    {
        _logger.LogInformation("GetOrderMessages endpoint called for order {OrderId}", id);
        
        // Check if the order exists
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null)
        {
            _logger.LogWarning("Order with ID {OrderId} not found", id);
            return NotFound($"Order with ID {id} not found");
        }
        
        // Get messages for the order
        var messages = await _orderService.GetOrderMessagesAsync(id);
        
        return Ok(messages);
    }
    
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> AddOrderMessage(int id, [FromBody] OrderMessageCreateDto messageDto)
    {
        _logger.LogInformation("AddOrderMessage endpoint called for order {OrderId}", id);
        
        // Validate the message
        if (string.IsNullOrWhiteSpace(messageDto.Content))
        {
            return BadRequest("Message cannot be empty");
        }
        
        // Check if the order exists
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null)
        {
            _logger.LogWarning("Order with ID {OrderId} not found", id);
            return NotFound($"Order with ID {id} not found");
        }
        
        // Set the order ID in the message DTO
        messageDto.OrderId = id;
        
        // Add the message
        var message = await _orderService.AddOrderMessageAsync(messageDto);
        
        // Return the full message object
        return Ok(message);
    }
    
    [HttpPut("messages/{id}/read")]
    public async Task<IActionResult> MarkMessageAsRead(int id)
    {
        _logger.LogInformation("MarkMessageAsRead endpoint called for message {MessageId}", id);
        
        try
        {
            await _orderService.MarkMessageAsReadAsync(id);
            return Ok(new { message = "Message marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message {MessageId} as read", id);
            return StatusCode(500, "An error occurred while marking the message as read");
        }
    }
}
