using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;
using Microsoft.Extensions.Logging;

namespace WebApplication1.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository orderRepository, ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _logger = logger;
    }

    public async Task<InsertResult> CreateOrderAsync(OrderCreateDto orderCreateDto)
    {
        try
        {
            // Calculate total amount
            var totalAmount = orderCreateDto.Items.Sum(i => i.Price * i.Quantity);

            // Insert the order
            var orderId = await _orderRepository.InsertOrderAsync(orderCreateDto, totalAmount);

            // Insert order items and update stock
            foreach (var item in orderCreateDto.Items)
            {
                await _orderRepository.InsertOrderItemAsync(orderId, item);
                await _orderRepository.UpdateStockAsync(item);
            }

            return InsertResult.Success;
        }
        catch (Exception ex)
        {
            // Log the exception
            Console.WriteLine($"Error creating order: {ex.Message}");
            return InsertResult.Error;
        }
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        return await _orderRepository.GetAllOrdersAsync();
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        return await _orderRepository.GetOrderByIdAsync(id);
    }

    public async Task UpdateOrderStatusAsync(int orderId, string status)
    {
        _logger.LogInformation("Updating order status for order {OrderId} to {Status}", orderId, status);
        await _orderRepository.UpdateOrderStatusAsync(orderId, status);
        _logger.LogInformation("Order status updated successfully for order {OrderId}", orderId);
    }
}
