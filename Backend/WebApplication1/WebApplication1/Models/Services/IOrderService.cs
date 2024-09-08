using WebApplication1.Models.Enums;

namespace WebApplication1.Models.Services;

public interface IOrderService
{
    public InsertResult CreateOrder(OrderCreateDto orderCreateDto);
    public List<OrderDto> GetAllOrders();
    public OrderDto? GetOrderById(int id);
}