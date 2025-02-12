using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;

namespace WebApplication1.Services.Interface;

public interface IOrderService
{
    Task<InsertResult> CreateOrderAsync(OrderCreateDto orderCreateDto);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<OrderDto?> GetOrderByIdAsync(int id);
}
