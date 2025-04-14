import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOrdersComponent } from './admin-orders.component';
import { OrderService } from '../../../services/order.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { OrderDto, OrderStatus } from '../../../models/order.model';
import { HttpClient } from '@angular/common/http';

describe('AdminOrdersComponent', () => {
  let component: AdminOrdersComponent;
  let fixture: ComponentFixture<AdminOrdersComponent>;
  let orderServiceMock: jasmine.SpyObj<OrderService>;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let activatedRouteMock: any;
  let httpClientMock: jasmine.SpyObj<HttpClient>;

  const mockOrders: OrderDto[] = [
    {
      id: 1,
      userId: '1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerAddress: '123 Test St',
      orderDate: '2023-05-15T10:30:00',
      totalAmount: 75.98,
      status: OrderStatus.Processing,
      orderItems: [
        {
          id: 1,
          orderId: 1,
          merchandiseId: 101,
          size: 'M',
          quantity: 2,
          price: 25.99,
          merchandise: {
            id: 101,
            name: 'T-Shirt',
            primaryImageUrl: '/images/tshirt.jpg'
          }
        }
      ]
    }
  ];

  beforeEach(async () => {
    orderServiceMock = jasmine.createSpyObj('OrderService', ['getAllOrders', 'updateOrderStatus', 'getApiUrl']);
    dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    httpClientMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);
    activatedRouteMock = {
      snapshot: {
        queryParams: {}
      }
    };

    orderServiceMock.getAllOrders.and.returnValue(of([...mockOrders]));
    orderServiceMock.updateOrderStatus.and.returnValue(of({}));
    orderServiceMock.getApiUrl.and.returnValue('https://api.example.com');
    
    // Fix for MatDialog open returning a properly structured object
    const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpyObj.afterClosed.and.returnValue(of(true));
    dialogMock.open.and.returnValue(dialogRefSpyObj);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        AdminOrdersComponent
      ],
      providers: [
        { provide: OrderService, useValue: orderServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: HttpClient, useValue: httpClientMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrdersComponent);
    component = fixture.componentInstance;
    
    // Set loading to false before detectChanges to match expected state in tests
    component.loading = false;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    expect(orderServiceMock.getAllOrders).toHaveBeenCalled();
    expect(component.orders).toEqual(mockOrders);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading orders', () => {
    orderServiceMock.getAllOrders.and.returnValue(throwError(() => new Error('Server error')));
    
    component.fetchAllOrders();
    
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should update order status', () => {
    const orderId = 1;
    const newStatus = OrderStatus.Shipped;
    
    component.updateOrderStatus(orderId, newStatus);
    
    expect(orderServiceMock.updateOrderStatus).toHaveBeenCalledWith(orderId, newStatus);
    const updatedOrder = component.orders.find(o => o.id === orderId);
    expect(updatedOrder?.status).toBe(newStatus);
  });

  it('should handle error when updating order status', () => {
    const orderId = 1;
    const newStatus = OrderStatus.Shipped;
    const originalStatus = OrderStatus.Processing;
    
    // Create a deep copy of the order to preserve the initial status
    const originalOrder = JSON.parse(JSON.stringify(mockOrders[0]));
    
    // Set up the error response
    orderServiceMock.updateOrderStatus.and.returnValue(throwError(() => new Error('Server error')));
    
    // Spy on window.alert to avoid actual alerts during testing
    spyOn(window, 'alert');
    
    // Update the test to not manually set originalStatuses
    const order = component.orders.find(o => o.id === orderId);
    if (order) {
      order.status = originalStatus;
    }
    
    component.updateOrderStatus(orderId, newStatus);
    
    const updatedOrder = component.orders.find(o => o.id === orderId);
    expect(updatedOrder?.status).toBe(originalStatus);
    expect(window.alert).toHaveBeenCalledWith('Failed to update order status. Please try again later.');
  });

  it('should format date correctly', () => {
    const dateString = '2023-05-15T10:30:00';
    const formattedDate = component.formatDate(dateString);
    expect(formattedDate).toContain('May 15, 2023');
  });
}); 