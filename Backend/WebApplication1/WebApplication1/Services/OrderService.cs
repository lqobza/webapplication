using WebApplication1.Models.DTOs;
using WebApplication1.Models.Enums;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services.Interface;
using Microsoft.Extensions.Logging;

namespace WebApplication1.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository orderRepository, ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _logger = logger;
    }

    public async Task<InsertResult> CreateOrderAsync(OrderCreateDto orderCreateDto)
    {
        try
        {
            _logger.LogInformation("Creating order with {ItemCount} items", orderCreateDto.Items.Count);
            
            // Log the items for debugging
            foreach (var item in orderCreateDto.Items)
            {
                _logger.LogInformation("Order item: MerchId={MerchId}, Size={Size}, Quantity={Quantity}, Price={Price}, IsCustom={IsCustom}",
                    item.MerchId, item.Size, item.Quantity, item.Price, item.IsCustom);
            }
            
            // Calculate total amount
            var totalAmount = orderCreateDto.Items.Sum(i => i.Price);

            // Insert the order
            var orderId = await _orderRepository.InsertOrderAsync(orderCreateDto, totalAmount);
            _logger.LogInformation("Order created with ID: {OrderId}", orderId);

            // Insert order items and update stock
            foreach (var item in orderCreateDto.Items)
            {
                try
                {
                    _logger.LogInformation("Inserting order item for order {OrderId}: MerchId={MerchId}, Size={Size}, Quantity={Quantity}",
                        orderId, item.MerchId, item.Size, item.Quantity);
                    
                    await _orderRepository.InsertOrderItemAsync(orderId, item);
                    
                    // Only update stock for regular merchandise (not custom)
                    if (!item.IsCustom)
                    {
                        try {
                            _logger.LogInformation("Updating stock for order {OrderId}, item: MerchId={MerchId}, Size={Size}, Quantity={Quantity}",
                                orderId, item.MerchId, item.Size, item.Quantity);
                                
                            await _orderRepository.UpdateStockAsync(item);
                        }
                        catch (InvalidOperationException ex) when (ex.Message.Contains("Insufficient stock"))
                        {
                            // If we encounter an insufficient stock error, we need to roll back the order
                            // by deleting it from the database
                            _logger.LogWarning("Insufficient stock for item: {Item}. Rolling back order {OrderId}.", item, orderId);
                            
                            try
                            {
                                // Delete the order we just created
                                await _orderRepository.DeleteOrderAsync(orderId);
                            }
                            catch (Exception rollbackEx)
                            {
                                _logger.LogError(rollbackEx, "Error rolling back order {OrderId}", orderId);
                            }
                            
                            // Re-throw the original exception to be handled by the controller
                            throw;
                        }
                    }
                }
                catch (Exception ex) when (!(ex is InvalidOperationException && ex.Message.Contains("Insufficient stock")))
                {
                    // If there's an error inserting an order item that's not related to insufficient stock,
                    // log it and roll back the order
                    _logger.LogError(ex, "Error inserting order item for order {OrderId}", orderId);
                    
                    try
                    {
                        // Delete the order we just created
                        await _orderRepository.DeleteOrderAsync(orderId);
                    }
                    catch (Exception rollbackEx)
                    {
                        _logger.LogError(rollbackEx, "Error rolling back order {OrderId}", orderId);
                    }
                    
                    return InsertResult.Error;
                }
            }

            _logger.LogInformation("Order {OrderId} created successfully", orderId);
            return InsertResult.Success;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Insufficient stock"))
        {
            // Let this exception propagate to the controller
            _logger.LogWarning(ex, "Insufficient stock error during order creation");
            throw;
        }
        catch (Exception ex)
        {
            // Log the exception
            _logger.LogError(ex, "Error creating order: {ErrorMessage}", ex.Message);
            return InsertResult.Error;
        }
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        return await _orderRepository.GetAllOrdersAsync();
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        return await _orderRepository.GetOrderByIdAsync(id);
    }

    public async Task UpdateOrderStatusAsync(int orderId, string status)
    {
        _logger.LogInformation("Updating order status for order {OrderId} to {Status}", orderId, status);
        await _orderRepository.UpdateOrderStatusAsync(orderId, status);
        _logger.LogInformation("Order status updated successfully for order {OrderId}", orderId);
    }

    public async Task<List<OrderDto>> GetOrdersByUserIdAsync(int userId)
    {
        _logger.LogInformation("Getting orders for user ID: {UserId}", userId);
        return await _orderRepository.GetOrdersByUserIdAsync(userId);
    }

    // Order Messages Implementation
    public async Task<OrderMessageDto> AddOrderMessageAsync(OrderMessageCreateDto messageDto)
    {
        _logger.LogInformation("Adding message for order {OrderId}", messageDto.OrderId);
        return await _orderRepository.AddOrderMessageAsync(messageDto);
    }

    public async Task<List<OrderMessageDto>> GetOrderMessagesAsync(int orderId)
    {
        _logger.LogInformation("Getting messages for order {OrderId}", orderId);
        return await _orderRepository.GetOrderMessagesAsync(orderId);
    }
}
