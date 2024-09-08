using WebApplication1.Models.Enums;
using WebApplication1.Models.Repositories;

namespace WebApplication1.Models.Services;

public class OrderService : BaseRepository, IOrderService
{
    private readonly IOrderRepository _orderRepository;

    public OrderService(IConfiguration configuration, IOrderRepository orderRepository)
        : base(configuration)
    {
        _orderRepository = orderRepository;
    }

    public InsertResult CreateOrder(OrderCreateDto orderCreateDto)
    {
        using (var connection = CreateConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Insert the order
                    var orderId = _orderRepository.InsertOrder(connection, transaction, orderCreateDto);

                    // Insert the order items and update instock values
                    foreach (var item in orderCreateDto.Items)
                    {
                        _orderRepository.InsertOrderItem(connection, transaction, orderId, item);
                        _orderRepository.UpdateStock(connection, transaction, item);
                    }

                    transaction.Commit();
                    return InsertResult.Success;
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    return InsertResult.Error;
                }
            }
        }
    }

    public List<OrderDto> GetAllOrders()
    {
        return _orderRepository.GetAllOrders();
    }

    public OrderDto? GetOrderById(int id)
    {
        return _orderRepository.GetOrderById(id);
    }
}