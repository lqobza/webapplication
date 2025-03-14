using System.Data.SqlClient;
using System.Security.Cryptography;
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
            INSERT INTO Orders (order_date, total_amount, customer_name, customer_email, customer_address, status, user_id)
            OUTPUT INSERTED.ID
            VALUES (GETDATE(), @totalAmount, @customerName, @customerEmail, @customerAddress, @status, @userId)";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@totalAmount", totalAmount);
        command.Parameters.AddWithValue("@customerName", orderCreateDto.CustomerName);
        command.Parameters.AddWithValue("@customerEmail", orderCreateDto.CustomerEmail);
        command.Parameters.AddWithValue("@customerAddress", orderCreateDto.CustomerAddress);
        command.Parameters.AddWithValue("@status", "Created");
        command.Parameters.AddWithValue("@userId", orderCreateDto.UserId);

        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        if (result == null)
        {
            throw new InvalidOperationException("Failed to get the inserted order ID");
        }
        return (int)result;
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
                Status = reader["status"] != DBNull.Value ? (string)reader["status"] : "Created",
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
                Status = reader["status"] != DBNull.Value ? (string)reader["status"] : "Created",
                Items = await GetOrderItemsByIdAsync((int)reader["id"])
            };

            return order;
        }

        return null;
    }

    private async Task<List<OrderItemDto>> GetOrderItemsByIdAsync(int orderId)
    {
        var query = @"
            SELECT oi.*, m.name as merchandise_name
            FROM OrderItems oi
            LEFT JOIN Merchandise m ON oi.merch_id = m.id
            WHERE oi.order_id = @orderId";
        query = @"
                SELECT oi.*, m.name as merchandise_name, mi.ImageUrl as image_url
                FROM OrderItems oi
                LEFT JOIN Merch m ON oi.merch_id = m.id
                LEFT JOIN MerchandiseImages mi ON oi.merch_id = mi.MerchId
                WHERE oi.order_id = @orderId";

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
                Price = (decimal)reader["price"],
                MerchandiseName =
                    reader["merchandise_name"] != DBNull.Value ? (string)reader["merchandise_name"] : null,
                ImageUrl = reader["image_url"] != DBNull.Value ? (string)reader["image_url"] : null
            };

            orderItemList.Add(orderItem);
        }

        return orderItemList;
    }

    public async Task UpdateOrderStatusAsync(int orderId, string status)
    {
        var query = @"UPDATE Orders SET status = @status WHERE id = @orderId";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@orderId", orderId);
        command.Parameters.AddWithValue("@status", status);

        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    public async Task<List<OrderDto>> GetOrdersByUserIdAsync(int userId)
    {
        var query = @"SELECT * FROM Orders WHERE user_id = @userId";

        var orderList = new List<OrderDto>();
        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@userId", userId);

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
                Status = reader["status"] != DBNull.Value ? (string)reader["status"] : "Created",
                Items = await GetOrderItemsByIdAsync((int)reader["id"])
            };
            orderList.Add(order);
        }

        return orderList;
    }

    // Order Messages Implementation
    public async Task<OrderMessageDto> AddOrderMessageAsync(OrderMessageCreateDto messageDto)
    {
        var query = @"
            INSERT INTO OrderMessages (OrderId, Content, Timestamp, IsFromAdmin, IsRead)
            OUTPUT INSERTED.Id, INSERTED.OrderId, INSERTED.Content, INSERTED.Timestamp, INSERTED.IsFromAdmin, INSERTED.IsRead
            VALUES (@orderId, @content, GETUTCDATE(), @isFromAdmin, 0)";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@orderId", messageDto.OrderId);
        command.Parameters.AddWithValue("@content", messageDto.Content);
        command.Parameters.AddWithValue("@isFromAdmin", messageDto.IsFromAdmin);

        await connection.OpenAsync();
        
        var message = new OrderMessageDto();
        
        await using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            message.Id = (int)reader["Id"];
            message.OrderId = (int)reader["OrderId"];
            message.Content = (string)reader["Content"];
            message.Timestamp = (DateTime)reader["Timestamp"];
            message.IsFromAdmin = (bool)reader["IsFromAdmin"];
            message.IsRead = (bool)reader["IsRead"];
        }
        else
        {
            throw new InvalidOperationException("Failed to get the inserted message");
        }
        
        return message;
    }

    public async Task<List<OrderMessageDto>> GetOrderMessagesAsync(int orderId)
    {
        var query = @"
            SELECT * FROM OrderMessages 
            WHERE OrderId = @orderId
            ORDER BY Timestamp ASC";

        var messageList = new List<OrderMessageDto>();
        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@orderId", orderId);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var message = new OrderMessageDto
            {
                Id = (int)reader["Id"],
                OrderId = (int)reader["OrderId"],
                Content = (string)reader["Content"],
                Timestamp = (DateTime)reader["Timestamp"],
                IsFromAdmin = (bool)reader["IsFromAdmin"],
                IsRead = (bool)reader["IsRead"]
            };
            messageList.Add(message);
        }

        return messageList;
    }

    public async Task MarkMessageAsReadAsync(int messageId)
    {
        var query = @"UPDATE OrderMessages SET IsRead = 1 WHERE Id = @messageId";

        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@messageId", messageId);

        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }
}
