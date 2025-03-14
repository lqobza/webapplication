using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;

namespace WebApplication1.Services.Interface;

public interface IOrderService
{
    Task<InsertResult> CreateOrderAsync(OrderCreateDto orderCreateDto);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<List<OrderDto>> GetOrdersByUserIdAsync(int userId);
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task UpdateOrderStatusAsync(int orderId, string status);
    
    // Order Messages
    Task<OrderMessageDto> AddOrderMessageAsync(OrderMessageCreateDto messageDto);
    Task<List<OrderMessageDto>> GetOrderMessagesAsync(int orderId);
    Task MarkMessageAsReadAsync(int messageId);
}
