using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Services.Interface;

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

    // Get all orders
    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders()
    {
        _logger.LogInformation("GetAllOrders endpoint called");

        var orderList = await _orderService.GetAllOrdersAsync();

        if (orderList.Count == 0)
        {
            _logger.LogInformation("No orders found");
            return NoContent();
        }

        _logger.LogInformation("Returning orders list");
        return Ok(orderList);
    }

    // Get order by ID
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

    // Create a new order
    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto orderCreateDto)
    {
        _logger.LogInformation("CreateOrder endpoint called");
        
        // Serialize the orderCreateDto object to JSON for detailed logging
        var orderCreateDtoJson = JsonConvert.SerializeObject(orderCreateDto, Formatting.Indented);
        _logger.LogInformation("Received OrderCreateDto: {OrderCreateDto}", orderCreateDtoJson);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid input data: {ModelStateErrors}", ModelState);
            return BadRequest(ModelState); // Keep returning ModelState for detailed error info
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
}
