import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { OrderDto } from '../models/order.model';
import { OrderMessage, OrderMessageCreate } from '../models/order-message.model';
import { environment } from 'src/environments/environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the correct API URL', () => {
    expect(service.getApiUrl()).toBe(environment.apiUrl);
  });

  describe('getAllOrders', () => {
    it('should retrieve and transform all orders', () => {
      // Mock server response
      const mockOrdersResponse = [
        {
          id: 1,
          userId: "101",
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerAddress: '123 Main St',
          orderDate: '2023-05-15T10:30:00',
          totalAmount: 125.50,
          status: 'Pending',
          items: [
            {
              id: 1,
              orderId: 1,
              merchId: 201,
              merchandiseName: 'T-Shirt',
              size: 'M',
              quantity: 2,
              price: 25.00,
              imageUrl: 'shirt.jpg'
            },
            {
              id: 2,
              orderId: 1,
              merchId: 202,
              merchandiseName: 'Hoodie',
              size: 'L',
              quantity: 1,
              price: 75.50,
              imageUrl: 'hoodie.jpg'
            }
          ]
        }
      ];

      // Expected transformed result
      const expectedOrders: OrderDto[] = [
        {
          id: 1,
          userId: "101",
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerAddress: '123 Main St',
          orderDate: '2023-05-15T10:30:00',
          totalAmount: 125.50,
          status: 'Pending',
          orderItems: [
            {
              id: 1,
              orderId: 1,
              merchandiseId: 201,
              merchandise: {
                id: 201,
                name: 'T-Shirt',
                primaryImageUrl: 'shirt.jpg'
              },
              size: 'M',
              quantity: 2,
              price: 25.00
            },
            {
              id: 2,
              orderId: 1,
              merchandiseId: 202,
              merchandise: {
                id: 202,
                name: 'Hoodie',
                primaryImageUrl: 'hoodie.jpg'
              },
              size: 'L',
              quantity: 1,
              price: 75.50
            }
          ]
        }
      ];

      service.getAllOrders().subscribe(orders => {
        expect(orders).toEqual(expectedOrders);
        expect(orders[0].orderItems.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrdersResponse);
    });

    it('should handle custom items correctly', () => {
      const mockOrderWithCustomItem = [
        {
          id: 2,
          userId: 102,
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          customerAddress: '456 Oak St',
          orderDate: '2023-05-16T14:20:00',
          totalAmount: 30.00,
          status: 'Processing',
          items: [
            {
              id: 3,
              orderId: 2,
              merchId: 301,
              isCustom: true,
              size: 'S',
              quantity: 1,
              price: 30.00
            }
          ]
        }
      ];

      service.getAllOrders().subscribe(orders => {
        expect(orders[0].orderItems[0].merchandise.name).toBe('Custom Design');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrderWithCustomItem);
    });
  });

  describe('getOrderById', () => {
    it('should fetch and transform a specific order', () => {
      const orderId = 1;
      const mockOrderResponse = {
        id: orderId,
        userId: 101,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerAddress: '123 Main St',
        orderDate: '2023-05-15T10:30:00',
        totalAmount: 125.50,
        status: 'Pending',
        items: [
          {
            id: 1,
            orderId: orderId,
            merchId: 201,
            merchandiseName: 'T-Shirt',
            size: 'M',
            quantity: 2,
            price: 25.00,
            imageUrl: 'shirt.jpg'
          }
        ]
      };

      service.getOrderById(orderId).subscribe(order => {
        expect(order.id).toBe(orderId);
        expect(order.customerName).toBe('John Doe');
        expect(order.orderItems.length).toBe(1);
        expect(order.orderItems[0].merchandise.name).toBe('T-Shirt');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/orders/${orderId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrderResponse);
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve user orders', () => {
      const mockUserOrdersResponse = [
        {
          id: 1,
          userId: 101,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerAddress: '123 Main St',
          orderDate: '2023-05-15T10:30:00',
          totalAmount: 50.00,
          status: 'Delivered',
          items: []
        }
      ];

      service.getUserOrders().subscribe(orders => {
        expect(orders.length).toBe(1);
        expect(orders[0].id).toBe(1);
        expect(orders[0].status).toBe('Delivered');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/orders`);
      expect(req.request.method).toBe('GET');
      
      // Mock a successful response with the orders
      req.flush(mockUserOrdersResponse, { 
        status: 200, 
        statusText: 'OK' 
      });
    });

    it('should return empty array for no content response', () => {
      service.getUserOrders().subscribe(orders => {
        expect(orders).toEqual([]);
        expect(orders.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/orders`);
      expect(req.request.method).toBe('GET');
      
      // Mock a 204 No Content response
      req.flush(null, { 
        status: 204, 
        statusText: 'No Content' 
      });
    });
  });

  describe('cancelOrder', () => {
    it('should send a cancellation request', () => {
      const orderId = 1;
      
      service.cancelOrder(orderId).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/${orderId}/cancel`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      
      req.flush({ success: true });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', () => {
      const orderId = 1;
      const newStatus = 'Shipped';
      
      service.updateOrderStatus(orderId, newStatus).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/${orderId}/status`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ status: newStatus });
      
      req.flush({ success: true });
    });
  });

  describe('orderMessages', () => {
    it('should retrieve order messages', () => {
      const orderId = 1;
      const mockMessages: OrderMessage[] = [
        { 
          id: 1, 
          orderId: orderId, 
          content: 'Message 1', 
          timestamp: '2023-05-16T10:30:00', 
          isFromAdmin: false 
        },
        { 
          id: 2, 
          orderId: orderId, 
          content: 'Message 2', 
          timestamp: '2023-05-16T11:00:00', 
          isFromAdmin: true 
        }
      ];
      
      service.getOrderMessages(orderId).subscribe(messages => {
        expect(messages.length).toBe(2);
        expect(messages[0].content).toBe('Message 1');
        expect(messages[1].isFromAdmin).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/${orderId}/messages`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockMessages);
    });

    it('should add a new order message', () => {
      const orderId = 1;
      const messageData: OrderMessageCreate = {
        content: 'New message',
        isFromAdmin: false,
        orderId: orderId
      };
      
      const mockResponse: OrderMessage = {
        id: 3,
        orderId: orderId,
        content: messageData.content,
        timestamp: '2023-05-16T12:00:00',
        isFromAdmin: messageData.isFromAdmin
      };
      
      service.addOrderMessage(orderId, messageData).subscribe(message => {
        expect(message.id).toBe(3);
        expect(message.content).toBe('New message');
        expect(message.isFromAdmin).toBeFalse();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/${orderId}/messages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(messageData);
      
      req.flush(mockResponse);
    });
  });
}); 