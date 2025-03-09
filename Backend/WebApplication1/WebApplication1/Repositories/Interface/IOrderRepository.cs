using WebApplication1.Models.DTOs;

namespace WebApplication1.Repositories.Interface;

public interface IOrderRepository
{
    Task<int> InsertOrderAsync(OrderCreateDto orderCreateDto, decimal totalAmount);
    Task InsertOrderItemAsync(int orderId, OrderItemDto item);
    Task UpdateStockAsync(OrderItemDto item);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<List<OrderDto>> GetOrdersByUserIdAsync(int userId);
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task UpdateOrderStatusAsync(int orderId, string status);
}
