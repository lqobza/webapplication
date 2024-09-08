using System.Data.SqlClient;

namespace WebApplication1.Models.Repositories;

public interface IOrderRepository
{
    public int InsertOrder(SqlConnection connection, SqlTransaction transaction, OrderCreateDto orderCreateDto);
    public void InsertOrderItem(SqlConnection connection, SqlTransaction transaction, int orderId, OrderItemDto item);
    public void UpdateStock(SqlConnection connection, SqlTransaction transaction, OrderItemDto item);
    public List<OrderDto> GetAllOrders();
    public OrderDto? GetOrderById(int id);
}