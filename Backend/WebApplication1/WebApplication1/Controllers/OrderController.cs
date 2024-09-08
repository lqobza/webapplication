using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using WebApplication1.Models.Enums;
using WebApplication1.Models.Services;

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

    //[Authorize(Roles = "Admin")]
    [HttpGet("orders")]
    public IActionResult GetAllOrders()
    {
        _logger.LogInformation("GetAllOrders endpoint called");

        var orderList = _orderService.GetAllOrders();

        if (orderList.Count == 0)
        {
            _logger.LogInformation("No orders found");
            return NoContent();
        }

        _logger.LogInformation("Returning orders list");
        return Ok(orderList);
    }

    [HttpGet("orders/{id:int}")]
    public IActionResult GetOrderById(int id)
    {
        _logger.LogInformation("GetOrderById endpoint called");

        var order = _orderService.GetOrderById(id);

        if (order == null)
        {
            _logger.LogInformation("Order not found");
            return NoContent();
        }

        _logger.LogInformation("Returning order: {id}", id);
        return Ok(order);
    }

    //[Authorize(Roles = "Admin")]
    [HttpPost("orders")]
    public IActionResult CreateOrder([FromBody] OrderCreateDto orderCreateDto)
    {
        _logger.LogInformation("CreateOrder endpoint called");

        var insertResult = _orderService.CreateOrder(orderCreateDto);
        if (insertResult == InsertResult.Success)
        {
            _logger.LogInformation("Merchandise inserted successfully: {Order}", orderCreateDto);
            return Ok(new { message = "Order created successfully" });
        }

        if (insertResult == InsertResult.Error)
        {
            _logger.LogError("Internal server error while inserting order: {Order}", orderCreateDto);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Order insert was unsuccessful due to internal server error" });
        }

        _logger.LogError("Error during order insert, this point shouldn't have been reached");
        return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error" });
    }
}