using System.Data;
using System.Data.SqlClient;
using WebApplication1.Models;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly string? _connectionString;

    public OrderRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }

    public async Task<int> InsertOrderAsync(OrderCreateDto orderCreateDto, decimal totalAmount)
    {
        var query = @"
            INSERT INTO Orders (order_date, total_amount, customer_name, customer_email, customer_address)
            OUTPUT INSERTED.ID
            VALUES (GETDATE(), @totalAmount, @customerName, @customerEmail, @customerAddress)";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@totalAmount", totalAmount);
        command.Parameters.AddWithValue("@customerName", orderCreateDto.CustomerName);
        command.Parameters.AddWithValue("@customerEmail", orderCreateDto.CustomerEmail);
        command.Parameters.AddWithValue("@customerAddress", orderCreateDto.CustomerAddress);

        await connection.OpenAsync();
        return (int)await command.ExecuteScalarAsync();
    }

    public async Task InsertOrderItemAsync(int orderId, OrderItemDto item)
    {
        var query = @"
        INSERT INTO OrderItems (order_id, merch_id, size, quantity, price)
        VALUES (@orderId, @merchId, @size, @quantity, @price)";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@orderId", orderId);
        command.Parameters.AddWithValue("@merchId", item.MerchId);
        command.Parameters.AddWithValue("@size", item.Size);
        command.Parameters.AddWithValue("@quantity", item.Quantity);
        command.Parameters.AddWithValue("@price", item.Price);

        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    public async Task UpdateStockAsync(OrderItemDto item)
    {
        var query = @"
            UPDATE MerchSize
            SET instock = instock - @quantity
            WHERE merch_id = @merchId AND size = @size AND instock >= @quantity";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@merchId", item.MerchId);
        command.Parameters.AddWithValue("@size", item.Size);
        command.Parameters.AddWithValue("@quantity", item.Quantity);

        await connection.OpenAsync();
        var rowsAffected = await command.ExecuteNonQueryAsync();

        if (rowsAffected == 0)
            throw new InvalidOperationException("Insufficient stock for merch ID " + item.MerchId +
                                               " with size " + item.Size);
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        var query = @"SELECT * FROM Orders";

        var orderList = new List<OrderDto>();
        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var order = new OrderDto
            {
                Id = (int)reader["id"],
                OrderDate = (DateTime)reader["order_date"],
                TotalAmount = (decimal)reader["total_amount"],
                CustomerName = (string)reader["customer_name"],
                CustomerEmail = (string)reader["customer_email"],
                CustomerAddress = (string)reader["customer_address"],
                Items = await GetOrderItemsByIdAsync((int)reader["id"])
            };
            orderList.Add(order);
        }

        return orderList;
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        var query = @"SELECT * FROM Orders WHERE id = @id";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@id", id);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            var order = new OrderDto
            {
                Id = (int)reader["id"],
                OrderDate = (DateTime)reader["order_date"],
                TotalAmount = (decimal)reader["total_amount"],
                CustomerName = (string)reader["customer_name"],
                CustomerEmail = (string)reader["customer_email"],
                CustomerAddress = (string)reader["customer_address"],
                Items = await GetOrderItemsByIdAsync((int)reader["id"])
            };

            return order;
        }

        return null;
    }

    private async Task<List<OrderItemDto>> GetOrderItemsByIdAsync(int orderId)
    {
        var query = @"SELECT * FROM OrderItems WHERE order_id = @orderId";

        var orderItemList = new List<OrderItemDto>();
        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@orderId", orderId);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
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
