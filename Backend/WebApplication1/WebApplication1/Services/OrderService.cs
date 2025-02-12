using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;

namespace WebApplication1.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;

    public OrderService(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
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
}
