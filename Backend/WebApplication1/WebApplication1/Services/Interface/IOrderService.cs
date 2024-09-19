using WebApplication1.Models;
using WebApplication1.Models.Enums;

namespace WebApplication1.Services.Interface;

public interface IOrderService
{
    public InsertResult CreateOrder(OrderCreateDto orderCreateDto);
    public List<OrderDto> GetAllOrders();
    public OrderDto? GetOrderById(int id);
}