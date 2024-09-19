using System.Data;
using System.Data.SqlClient;
using WebApplication1.Models;
using WebApplication1.Models.Repositories;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class OrderRepository : BaseRepository, IOrderRepository
{
    private readonly ILogger<OrderRepository> _logger;

    public OrderRepository(IConfiguration configuration, ILogger<OrderRepository> logger)
        : base(configuration)
    {
        _logger = logger;
    }

    public int InsertOrder(SqlConnection connection, SqlTransaction transaction, OrderCreateDto orderCreateDto)
    {
        var query = @"
            INSERT INTO Orders (order_date, total_amount, customer_name, customer_email, customer_address)
            OUTPUT INSERTED.ID
            VALUES (GETDATE(), @totalAmount, @customerName, @customerEmail, @customerAddress)";

        using var command = new SqlCommand(query, connection, transaction);
        
        var totalAmount = orderCreateDto.Items.Sum(i => i.Price * i.Quantity);

        command.Parameters.AddWithValue("@totalAmount", totalAmount);
        command.Parameters.AddWithValue("@customerName", orderCreateDto.CustomerName);
        command.Parameters.AddWithValue("@customerEmail", orderCreateDto.CustomerEmail);
        command.Parameters.AddWithValue("@customerAddress", orderCreateDto.CustomerAddress);

        return (int)command.ExecuteScalar();
    }

    public void InsertOrderItem(SqlConnection connection, SqlTransaction transaction, int orderId, OrderItemDto item)
    {
        var query = @"
        INSERT INTO OrderItems (order_id, merch_id, size, quantity, price)
        VALUES (@orderId, @merchId, @size, @quantity, @price)";


        connection.Open();
        using var command = new SqlCommand(query, connection, transaction);
        
        command.Parameters.AddWithValue("@orderId", orderId);
        command.Parameters.AddWithValue("@merchId", item.MerchId);
        command.Parameters.AddWithValue("@size", item.Size);
        command.Parameters.AddWithValue("@quantity", item.Quantity);
        command.Parameters.AddWithValue("@price", item.Price); //TODO: price should be queried (only during insert in case price changes later the customer should still get the order for the price that was displayed during the purchase) and calculated on backend site based on the ordered items in theory this should be working like this, test it

        command.ExecuteNonQuery();
    }


    public void UpdateStock(SqlConnection connection, SqlTransaction transaction, OrderItemDto item)
    {
        var query = @"
            UPDATE MerchSize
            SET instock = instock - @quantity
            WHERE merch_id = @merchId AND size = @size AND instock >= @quantity";
        
        using var command = new SqlCommand(query, connection, transaction);
        
        command.Parameters.AddWithValue("@merchId",
            item.MerchId); //TODO: rewrite these in this format: command.Parameters.Add(new SqlParameter("@id", SqlDbType.Int) { Value = id });
        command.Parameters.AddWithValue("@size",
            item.Size); //TODO: rewrite these in this format: command.Parameters.Add(new SqlParameter("@id", SqlDbType.Int) { Value = id });
        command.Parameters.AddWithValue("@quantity",
            item.Quantity); //TODO: rewrite these in this format: command.Parameters.Add(new SqlParameter("@id", SqlDbType.Int) { Value = id });

        var rowsAffected = command.ExecuteNonQuery();
        if (rowsAffected == 0)
            throw new InvalidOperationException("Insufficient stock for merch ID " + item.MerchId +
                                                " with size " + item.Size);
    }

    public List<OrderDto> GetAllOrders()
    {
        var query = @"SELECT * FROM Orders";

        var orderList = new List<OrderDto>();
        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand(query, connection);
        using var reader = command.ExecuteReader();
        
        while (reader.Read())
        {
            var order = new OrderDto
            {
                Id = (int)reader["id"],
                OrderDate = (DateTime)reader["order_date"],
                TotalAmount = (decimal)reader["total_amount"],
                CustomerName = (string)reader["customer_name"],
                CustomerEmail = (string)reader["customer_email"],
                CustomerAddress = (string)reader["customer_address"],
                Items = new List<OrderItemDto>()
            };
            orderList.Add(order);
        }

        // Populate Items for each order
        foreach (var order in orderList) order.Items = GetOrderItemsById(order.Id);

        return orderList;
    }

    public OrderDto? GetOrderById(int id)
    {
        var query = @"SELECT * FROM Orders WHERE id = @id";

        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand(query, connection);
        
        command.Parameters.Add(new SqlParameter("@id", SqlDbType.Int) { Value = id });

        using var reader = command.ExecuteReader();
        
        if (reader.Read())
        {
            var order = new OrderDto
            {
                Id = (int)reader["id"],
                OrderDate = (DateTime)reader["order_date"],
                TotalAmount = (decimal)reader["total_amount"],
                CustomerName = (string)reader["customer_name"],
                CustomerEmail = (string)reader["customer_email"],
                CustomerAddress = (string)reader["customer_address"],
                Items = GetOrderItemsById(id)
            };

            //order.Items = GetOrderItemsById(id);
            return order;
        }
                    
        return null;
    }

    private List<OrderItemDto> GetOrderItemsById(int orderId)
    {
        var query = @"SELECT * FROM OrderItems WHERE order_id = @orderId";

        var orderItemList = new List<OrderItemDto>();
        using var connection = CreateConnection();
        
        connection.Open();
        using var command = new SqlCommand(query, connection);
        
        command.Parameters.Add(new SqlParameter("@orderId", SqlDbType.Int) { Value = orderId });
        using var reader = command.ExecuteReader();
        
        while (reader.Read())
        {
            var orderItem = new OrderItemDto
            {
                Id = (int)reader["id"],
                OrderId = (int)reader["order_id"],
                MerchId = (int)reader["merch_id"],
                Size = (string)reader["size"],
                Quantity = (int)reader["quantity"],
                Price = (decimal)reader["price"]
            };
            orderItemList.Add(orderItem);
        }

        return orderItemList;
    }
}