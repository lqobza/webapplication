using System.Data.SqlClient;
using System.Security.Cryptography;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;
using Microsoft.Extensions.Logging;

namespace WebApplication1.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly string? _connectionString;
    private readonly ILogger<OrderRepository> _logger;

    public OrderRepository(IConfiguration configuration, ILogger<OrderRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
        _logger = logger;
    }

    public async Task<int> InsertOrderAsync(OrderCreateDto orderCreateDto, decimal totalAmount)
    {
        _logger.LogInformation("Creating order for customer {CustomerName}, total amount: {TotalAmount}",
            orderCreateDto.CustomerName, totalAmount);
        
        var query = @"
            INSERT INTO Orders (order_date, total_amount, customer_name, customer_email, customer_address, status, user_id)
            OUTPUT INSERTED.ID
            VALUES (GETDATE(), @totalAmount, @customerName, @customerEmail, @customerAddress, @status, @userId)";

        try
        {
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
            
            int orderId = (int)result;
            _logger.LogInformation("Order created successfully with ID: {OrderId}", orderId);
            return orderId;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error creating order: {ErrorMessage}", ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order: {ErrorMessage}", ex.Message);
            throw;
        }
    }

    public async Task InsertOrderItemAsync(int orderId, OrderItemDto item)
    {
        _logger.LogInformation("Inserting order item for order {OrderId}: MerchId={MerchId}, Size={Size}, Quantity={Quantity}",
            orderId, item.MerchId, item.Size, item.Quantity);
        
        string query;
        
        if (item.MerchId == null)
        {
            query = @"
            INSERT INTO OrderItems (order_id, size, quantity, price, merchandise_name, image_url, is_custom)
            VALUES (@orderId, @size, @quantity, @price, @merchandiseName, @imageUrl, @isCustom)";
        }
        else
        {
            query = @"
            INSERT INTO OrderItems (order_id, merch_id, size, quantity, price, merchandise_name, image_url, is_custom)
            VALUES (@orderId, @merchId, @size, @quantity, @price, @merchandiseName, @imageUrl, @isCustom)";
        }

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand(query, connection);

            command.Parameters.AddWithValue("@orderId", orderId);
            if (item.MerchId != null)
            {
                command.Parameters.AddWithValue("@merchId", item.MerchId);
            }
            command.Parameters.AddWithValue("@size", item.Size);
            command.Parameters.AddWithValue("@quantity", item.Quantity);
            command.Parameters.AddWithValue("@price", item.Price);
            command.Parameters.AddWithValue("@merchandiseName", item.MerchandiseName ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@imageUrl", item.ImageUrl ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@isCustom", item.IsCustom);

            await connection.OpenAsync();
            int rowsAffected = await command.ExecuteNonQueryAsync();
            
            if (rowsAffected == 0)
            {
                throw new InvalidOperationException($"Failed to insert order item for order {orderId}");
            }
            
            _logger.LogInformation("Successfully inserted order item for order {OrderId}", orderId);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error inserting order item for order {OrderId}: {ErrorMessage}", orderId, ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inserting order item for order {OrderId}: {ErrorMessage}", orderId, ex.Message);
            throw;
        }
    }

    public async Task UpdateStockAsync(OrderItemDto item)
    {
        if (item.IsCustom || item.MerchId == null || item.MerchId <= 0)
        {
            return;
        }

        _logger.LogInformation("Updating stock for item: MerchId={MerchId}, Size={Size}, Quantity={Quantity}", 
            item.MerchId, item.Size, item.Quantity);

        var checkStockQuery = @"
            SELECT ms.instock, m.name
            FROM MerchSize ms
            JOIN Merch m ON ms.merch_id = m.id
            WHERE ms.merch_id = @merchId AND UPPER(ms.size) = UPPER(@size)";

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        int availableStock = 0;
        string merchandiseName = "";
        
        await using (var command = new SqlCommand(checkStockQuery, connection))
        {
            command.Parameters.AddWithValue("@merchId", item.MerchId);
            command.Parameters.AddWithValue("@size", item.Size);

            _logger.LogInformation("Executing stock check query for MerchId={MerchId}, Size={Size}", 
                item.MerchId, item.Size);

            await using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                availableStock = reader.GetInt32(0);
                merchandiseName = reader.GetString(1);
                _logger.LogInformation("Found stock information: MerchId={MerchId}, Size={Size}, Available={Available}", 
                    item.MerchId, item.Size, availableStock);
            }
            else
            {
                _logger.LogWarning("Item with ID {MerchId} and size {Size} not found in stock", 
                    item.MerchId, item.Size);
                throw new InvalidOperationException($"Item with ID {item.MerchId} and size {item.Size} not found in stock");
            }
        }

        if (availableStock < item.Quantity)
        {
            _logger.LogWarning("Insufficient stock for '{MerchandiseName}' (Size: {Size}). Requested: {Requested}, Available: {Available}", 
                merchandiseName, item.Size, item.Quantity, availableStock);
            throw new InvalidOperationException(
                $"Insufficient stock for '{merchandiseName}' (Size: {item.Size}). " +
                $"Requested: {item.Quantity}, Available: {availableStock}");
        }

        var updateStockQuery = @"
            UPDATE MerchSize
            SET instock = instock - @quantity
            WHERE merch_id = @merchId AND UPPER(size) = UPPER(@size)";

        await using var updateCommand = new SqlCommand(updateStockQuery, connection);
        updateCommand.Parameters.AddWithValue("@merchId", item.MerchId);
        updateCommand.Parameters.AddWithValue("@size", item.Size);
        updateCommand.Parameters.AddWithValue("@quantity", item.Quantity);

        _logger.LogInformation("Executing stock update query for MerchId={MerchId}, Size={Size}, Quantity={Quantity}", 
            item.MerchId, item.Size, item.Quantity);

        var rowsAffected = await updateCommand.ExecuteNonQueryAsync();

        if (rowsAffected == 0)
        {
            _logger.LogWarning("Failed to update stock for '{MerchandiseName}' (Size: {Size})", 
                merchandiseName, item.Size);
            throw new InvalidOperationException(
                $"Failed to update stock for '{merchandiseName}' (Size: {item.Size})");
        }

        _logger.LogInformation("Successfully updated stock for '{MerchandiseName}' (Size: {Size}). New stock: {NewStock}", 
            merchandiseName, item.Size, availableStock - item.Quantity);
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

    public async Task<List<OrderItemDto>> GetOrderItemsByIdAsync(int orderId)
    {
        const string query = @"
            SELECT id, order_id, merch_id, size, quantity, price, merchandise_name, image_url, is_custom
            FROM OrderItems
            WHERE order_id = @orderId";

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
                MerchId = reader["merch_id"] != DBNull.Value ? (int?)reader["merch_id"] : null,
                Size = (string)reader["size"],
                Quantity = (int)reader["quantity"],
                Price = (decimal)reader["price"],
                MerchandiseName = reader["merchandise_name"] != DBNull.Value ? (string)reader["merchandise_name"] : null,
                ImageUrl = reader["image_url"] != DBNull.Value ? (string)reader["image_url"] : null,
                IsCustom = reader["is_custom"] != DBNull.Value && (bool)reader["is_custom"]
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

    public async Task<OrderMessageDto> AddOrderMessageAsync(OrderMessageCreateDto messageDto)
    {
        var query = @"
            INSERT INTO OrderMessages (OrderId, Content, Timestamp, IsFromAdmin)
            OUTPUT INSERTED.Id, INSERTED.OrderId, INSERTED.Content, INSERTED.Timestamp, INSERTED.IsFromAdmin
            VALUES (@orderId, @content, GETUTCDATE(), @isFromAdmin)";

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
            SELECT Id, OrderId, Content, Timestamp, IsFromAdmin
            FROM OrderMessages
            WHERE OrderId = @orderId
            ORDER BY Timestamp ASC";

        var messageList = new List<OrderMessageDto>();

        using (var connection = new SqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@orderId", orderId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var message = new OrderMessageDto
                {
                    Id = (int)reader["Id"],
                    OrderId = (int)reader["OrderId"],
                    Content = (string)reader["Content"],
                    Timestamp = (DateTime)reader["Timestamp"],
                    IsFromAdmin = (bool)reader["IsFromAdmin"]
                };

                messageList.Add(message);
            }
        }

        return messageList;
    }

    public async Task DeleteOrderAsync(int orderId)
    {
        _logger.LogInformation("Deleting order with ID: {OrderId}", orderId);
        
        var deleteItemsQuery = @"DELETE FROM OrderItems WHERE order_id = @orderId";
        
        var deleteMessagesQuery = @"
        IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'OrderMessages')
        BEGIN
            IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OrderMessages' AND COLUMN_NAME = 'order_id')
            BEGIN
                DELETE FROM OrderMessages WHERE order_id = @orderId
            END
            ELSE IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OrderMessages' AND COLUMN_NAME = 'OrderId')
            BEGIN
                DELETE FROM OrderMessages WHERE OrderId = @orderId
            END
        END";
        
        var deleteOrderQuery = @"DELETE FROM Orders WHERE id = @orderId";
        
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        await using var transaction = await connection.BeginTransactionAsync();
        
        try
        {
            await using (var command = new SqlCommand(deleteItemsQuery, connection, transaction as SqlTransaction))
            {
                command.Parameters.AddWithValue("@orderId", orderId);
                var itemsDeleted = await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Deleted {Count} order items for order {OrderId}", itemsDeleted, orderId);
            }
            
            try
            {
                await using (var command = new SqlCommand(deleteMessagesQuery, connection, transaction as SqlTransaction))
                {
                    command.Parameters.AddWithValue("@orderId", orderId);
                    await command.ExecuteNonQueryAsync();
                    _logger.LogInformation("Deleted order messages for order {OrderId} (if any)", orderId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error deleting order messages for order {OrderId}. This is not critical and the deletion process will continue.", orderId);
            }
            
            await using (var command = new SqlCommand(deleteOrderQuery, connection, transaction as SqlTransaction))
            {
                command.Parameters.AddWithValue("@orderId", orderId);
                var orderDeleted = await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Deleted order {OrderId}: {Success}", orderId, orderDeleted > 0);
            }
            
            await transaction.CommitAsync();
            _logger.LogInformation("Order {OrderId} deleted successfully", orderId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error deleting order {OrderId}", orderId);
            throw;
        }
    }
}
