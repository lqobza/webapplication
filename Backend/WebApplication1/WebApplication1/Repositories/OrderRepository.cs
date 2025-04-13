using System.Data.SqlClient;
using WebApplication1.Models.DTOs;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class OrderRepository : BaseRepository, IOrderRepository
{
    private readonly ILogger<OrderRepository> _logger;
    private readonly IDatabaseWrapper _db;

    public OrderRepository(ILogger<OrderRepository> logger, IDatabaseWrapper databaseWrapper)
        : base(databaseWrapper)
    {
        _logger = logger;
        _db = databaseWrapper;
    }

    public Task<int> InsertOrderAsync(OrderCreateDto orderCreateDto, decimal totalAmount)
    {
        _logger.LogInformation("Creating order for customer {CustomerName}, total amount: {TotalAmount}",
            orderCreateDto.CustomerName, totalAmount);

        const string command = @"
            INSERT INTO Orders (order_date, total_amount, customer_name, customer_email, customer_address, status, user_id)
            OUTPUT INSERTED.ID
            VALUES (GETDATE(), @totalAmount, @customerName, @customerEmail, @customerAddress, @status, @userId)";

        try
        {
            var parameters = new[]
            {
                new SqlParameter("@totalAmount", totalAmount),
                new SqlParameter("@customerName", orderCreateDto.CustomerName),
                new SqlParameter("@customerEmail", orderCreateDto.CustomerEmail),
                new SqlParameter("@customerAddress", orderCreateDto.CustomerAddress),
                new SqlParameter("@status", "Created"),
                new SqlParameter("@userId", orderCreateDto.UserId)
            };

            var result = _db.ExecuteScalar(command, parameters);
            if (result == null) throw new InvalidOperationException("Failed to get the inserted order ID");

            var orderId = Convert.ToInt32(result);
            _logger.LogInformation("Order created successfully with ID: {OrderId}", orderId);
            return Task.FromResult(orderId);
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

    public Task InsertOrderItemAsync(int orderId, OrderItemDto item)
    {
        _logger.LogInformation(
            "Inserting order item for order {OrderId}: MerchId={MerchId}, Size={Size}, Quantity={Quantity}",
            orderId, item.MerchId, item.Size, item.Quantity);

        var command = item.MerchId == null
            ? @"
            INSERT INTO OrderItems (order_id, size, quantity, price, merchandise_name, image_url, is_custom)
            VALUES (@orderId, @size, @quantity, @price, @merchandiseName, @imageUrl, @isCustom)"
            : @"
            INSERT INTO OrderItems (order_id, merch_id, size, quantity, price, merchandise_name, image_url, is_custom)
            VALUES (@orderId, @merchId, @size, @quantity, @price, @merchandiseName, @imageUrl, @isCustom)";

        try
        {
            var parameters = new List<SqlParameter>
            {
                new("@orderId", orderId)
            };

            if (item.MerchId != null) parameters.Add(new SqlParameter("@merchId", item.MerchId));

            parameters.AddRange(new[]
            {
                new SqlParameter("@size", item.Size),
                new SqlParameter("@quantity", item.Quantity),
                new SqlParameter("@price", item.Price),
                new SqlParameter("@merchandiseName", item.MerchandiseName ?? (object)DBNull.Value),
                new SqlParameter("@imageUrl", item.ImageUrl ?? (object)DBNull.Value),
                new SqlParameter("@isCustom", item.IsCustom)
            });

            _db.ExecuteNonQuery(command, parameters.ToArray());

            _logger.LogInformation("Successfully inserted order item for order {OrderId}", orderId);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error inserting order item for order {OrderId}: {ErrorMessage}", orderId,
                ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inserting order item for order {OrderId}: {ErrorMessage}", orderId, ex.Message);
            throw;
        }

        return Task.CompletedTask;
    }

    public Task UpdateStockAsync(OrderItemDto item)
    {
        if (item.IsCustom || item.MerchId == null || item.MerchId <= 0) return Task.CompletedTask;

        _logger.LogInformation("Updating stock for item: MerchId={MerchId}, Size={Size}, Quantity={Quantity}",
            item.MerchId, item.Size, item.Quantity);

        const string command = @"
            SELECT ms.instock, m.name
            FROM MerchSize ms
            JOIN Merch m ON ms.merch_id = m.id
            WHERE ms.merch_id = @merchId AND UPPER(ms.size) = UPPER(@size)";

        var parameters = new[]
        {
            new SqlParameter("@merchId", item.MerchId),
            new SqlParameter("@size", item.Size)
        };

        _logger.LogInformation("Executing stock check query for MerchId={MerchId}, Size={Size}",
            item.MerchId, item.Size);

        var result = _db.ExecuteScalar(command, parameters);

        if (result == null)
        {
            _logger.LogWarning("Item with ID {MerchId} and size {Size} not found in stock",
                item.MerchId, item.Size);
            throw new InvalidOperationException($"Item with ID {item.MerchId} and size {item.Size} not found in stock");
        }

        var availableStock = Convert.ToInt32(result);
        var merchandiseName = result.ToString();
        _logger.LogInformation("Found stock information: MerchId={MerchId}, Size={Size}, Available={Available}",
            item.MerchId, item.Size, availableStock);

        if (availableStock < item.Quantity)
        {
            _logger.LogWarning(
                "Insufficient stock for '{MerchandiseName}' (Size: {Size}). Requested: {Requested}, Available: {Available}",
                merchandiseName, item.Size, item.Quantity, availableStock);
            throw new InvalidOperationException(
                $"Insufficient stock for '{merchandiseName}' (Size: {item.Size}). " +
                $"Requested: {item.Quantity}, Available: {availableStock}");
        }

        const string updateStockCommand = @"
            UPDATE MerchSize
            SET instock = instock - @quantity
            WHERE merch_id = @merchId AND UPPER(size) = UPPER(@size)";

        var updateParameters = new[]
        {
            new SqlParameter("@merchId", item.MerchId),
            new SqlParameter("@size", item.Size),
            new SqlParameter("@quantity", item.Quantity)
        };

        _logger.LogInformation("Executing stock update query for MerchId={MerchId}, Size={Size}, Quantity={Quantity}",
            item.MerchId, item.Size, item.Quantity);

        _db.ExecuteNonQuery(updateStockCommand, updateParameters);

        _logger.LogInformation(
            "Successfully updated stock for '{MerchandiseName}' (Size: {Size}). New stock: {NewStock}",
            merchandiseName, item.Size, availableStock - item.Quantity);
        return Task.CompletedTask;
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        const string command = @"SELECT * FROM Orders";

        var orderList = new List<OrderDto>();
        using var reader = _db.ExecuteReader(command);

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
                Status = reader["status"] != DBNull.Value ? (string)reader["status"] : "Created",
                Items = await GetOrderItemsByIdAsync((int)reader["id"])
            };
            orderList.Add(order);
        }

        return orderList;
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        const string command = @"SELECT * FROM Orders WHERE id = @id";

        var parameters = new[]
        {
            new SqlParameter("@id", id)
        };

        using var reader = _db.ExecuteReader(command, parameters);

        if (!reader.Read()) return null;
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

    private Task<List<OrderItemDto>> GetOrderItemsByIdAsync(int orderId)
    {
        const string command = @"
            SELECT id, order_id, merch_id, size, quantity, price, merchandise_name, image_url, is_custom
            FROM OrderItems
            WHERE order_id = @orderId";

        var parameters = new[]
        {
            new SqlParameter("@orderId", orderId)
        };

        var orderItemList = new List<OrderItemDto>();
        using var reader = _db.ExecuteReader(command, parameters);

        while (reader.Read())
        {
            var orderItem = new OrderItemDto
            {
                Id = (int)reader["id"],
                OrderId = (int)reader["order_id"],
                MerchId = reader["merch_id"] != DBNull.Value ? (int?)reader["merch_id"] : null,
                Size = (string)reader["size"],
                Quantity = (int)reader["quantity"],
                Price = (decimal)reader["price"],
                MerchandiseName =
                    reader["merchandise_name"] != DBNull.Value ? (string)reader["merchandise_name"] : null,
                ImageUrl = reader["image_url"] != DBNull.Value ? (string)reader["image_url"] : null,
                IsCustom = reader["is_custom"] != DBNull.Value && (bool)reader["is_custom"]
            };

            orderItemList.Add(orderItem);
        }

        return Task.FromResult(orderItemList);
    }

    public Task UpdateOrderStatusAsync(int orderId, string status)
    {
        const string command = @"UPDATE Orders SET status = @status WHERE id = @orderId";

        var parameters = new[]
        {
            new SqlParameter("@orderId", orderId),
            new SqlParameter("@status", status)
        };

        _db.ExecuteNonQuery(command, parameters);
        return Task.CompletedTask;
    }

    public async Task<List<OrderDto>> GetOrdersByUserIdAsync(int userId)
    {
        const string command = @"SELECT * FROM Orders WHERE user_id = @userId";

        var parameters = new[]
        {
            new SqlParameter("@userId", userId)
        };

        var orderList = new List<OrderDto>();
        using var reader = _db.ExecuteReader(command, parameters);

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
                Status = reader["status"] != DBNull.Value ? (string)reader["status"] : "Created",
                Items = await GetOrderItemsByIdAsync((int)reader["id"])
            };
            orderList.Add(order);
        }

        return orderList;
    }

    public Task<OrderMessageDto> AddOrderMessageAsync(OrderMessageCreateDto messageDto)
    {
        const string command = @"
            INSERT INTO OrderMessages (OrderId, Content, Timestamp, IsFromAdmin)
            OUTPUT INSERTED.Id, INSERTED.OrderId, INSERTED.Content, INSERTED.Timestamp, INSERTED.IsFromAdmin
            VALUES (@orderId, @content, GETUTCDATE(), @isFromAdmin)";

        var parameters = new[]
        {
            new SqlParameter("@orderId", messageDto.OrderId),
            new SqlParameter("@content", messageDto.Content),
            new SqlParameter("@isFromAdmin", messageDto.IsFromAdmin)
        };

        using var reader = _db.ExecuteReader(command, parameters);

        var message = new OrderMessageDto();

        if (reader.Read())
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

        return Task.FromResult(message);
    }

    public Task<List<OrderMessageDto>> GetOrderMessagesAsync(int orderId)
    {
        const string command = @"
            SELECT Id, OrderId, Content, Timestamp, IsFromAdmin
            FROM OrderMessages
            WHERE OrderId = @orderId
            ORDER BY Timestamp";

        var parameters = new[]
        {
            new SqlParameter("@orderId", orderId)
        };

        var messageList = new List<OrderMessageDto>();
        using var reader = _db.ExecuteReader(command, parameters);

        while (reader.Read())
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

        return Task.FromResult(messageList);
    }

    public async Task DeleteOrderAsync(int orderId)
    {
        _logger.LogInformation("Deleting order with ID: {OrderId}", orderId);

        const string deleteItemsCommand = @"DELETE FROM OrderItems WHERE order_id = @orderId";

        const string deleteMessagesCommand = @"
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

        const string deleteOrderCommand = @"DELETE FROM Orders WHERE id = @orderId";

        using var transaction = await _db.BeginTransactionAsync();

        try
        {
            var deleteItemsParameters = new[]
            {
                new SqlParameter("@orderId", orderId)
            };

            var itemsDeleted = _db.ExecuteNonQuery(deleteItemsCommand, deleteItemsParameters, transaction);
            _logger.LogInformation("Deleted {Count} order items for order {OrderId}", itemsDeleted, orderId);

            try
            {
                var deleteMessagesParameters = new[]
                {
                    new SqlParameter("@orderId", orderId)
                };

                _db.ExecuteNonQuery(deleteMessagesCommand, deleteMessagesParameters, transaction);
                _logger.LogInformation("Deleted order messages for order {OrderId} (if any)", orderId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Error deleting order messages for order {OrderId}. This is not critical and the deletion process will continue.",
                    orderId);
            }

            var deleteOrderParameters = new[]
            {
                new SqlParameter("@orderId", orderId)
            };

            var orderDeleted = _db.ExecuteNonQuery(deleteOrderCommand, deleteOrderParameters, transaction);
            _logger.LogInformation("Deleted order {OrderId}: {Success}", orderId, orderDeleted > 0);

            transaction.Commit();
            _logger.LogInformation("Order {OrderId} deleted successfully", orderId);
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            _logger.LogError(ex, "Error deleting order {OrderId}", orderId);
            throw;
        }
        finally
        {
            transaction.Connection?.Close();
        }
    }
}