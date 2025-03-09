﻿using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
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
}
