import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderDetailsComponent } from './order-details.component';
import { OrderService } from '../../services/order.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { OrderStatus } from '../../models/order.model';
import { environment } from '../../../environments/environment';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { OrderMessagesComponent } from '../order-messages/order-messages.component';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('OrderDetailsComponent', () => {
  let component: OrderDetailsComponent;
  let fixture: ComponentFixture<OrderDetailsComponent>;
  let orderServiceMock: jasmine.SpyObj<OrderService>;
  let dialogRefMock: jasmine.SpyObj<MatDialogRef<OrderDetailsComponent>>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  // Using 'any' type to avoid interface mismatch issues
  const mockOrder: any = {
    id: 1,
    orderNumber: 'ORD-001',
    userId: '1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerAddress: '123 Test St',
    totalAmount: 75.98,
    status: OrderStatus.Processing,
    createdAt: '2023-05-15T10:30:00',
    updatedAt: '2023-05-15T14:20:00',
    orderItems: [
      {
        id: 1,
        orderId: 1,
        merchandiseId: 101,
        name: 'T-Shirt',
        size: 'M',
        quantity: 2,
        price: 25.99,
        merchandise: {
          id: 101,
          name: 'T-Shirt',
          primaryImageUrl: '/images/tshirt.jpg'
        }
      },
      {
        id: 2,
        orderId: 1,
        merchandiseId: 0,
        name: 'Custom Hoodie',
        size: 'L',
        quantity: 1,
        price: 24.00,
        isCustom: true,
        customDesignFrontImageUrl: 'data:image/png;base64,test',
        merchandise: null
      }
    ],
    messages: []
  };

  beforeEach(async () => {
    orderServiceMock = jasmine.createSpyObj('OrderService', [
      'getOrderById',
      'updateOrderStatus',
      'getOrderMessages'
    ]);
    dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    // Setup default mock returns
    orderServiceMock.getOrderById.and.returnValue(of(mockOrder));
    orderServiceMock.getOrderMessages.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        OrderDetailsComponent,
        OrderMessagesComponent
      ],
      providers: [
        { provide: OrderService, useValue: orderServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: { orderId: 1 } },
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load order details on init', () => {
    expect(orderServiceMock.getOrderById).toHaveBeenCalledWith(1);
    expect(component.order).toEqual(mockOrder);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading order details', () => {
    // Reset the component
    component.order = null;
    orderServiceMock.getOrderById.and.returnValue(throwError(() => new Error('Server error')));
    
    // Call the method
    component.fetchOrderDetails();
    
    // Verify error handling
    expect(component.error).toBe('Failed to load order details. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('should format date correctly', () => {
    const dateString = '2023-05-15T10:30:00';
    const formattedDate = component.formatDate(dateString);
    
    // The exact format will depend on the user's locale, so we'll check for basic formatting
    expect(formattedDate).toContain('2023');
    expect(formattedDate).toContain('5');
    expect(formattedDate).toContain('15');
    expect(formattedDate).toContain('10');
    expect(formattedDate).toContain('30');
  });

  it('should return correct order status classes', () => {
    expect(component.getOrderStatusClass(OrderStatus.Created)).toBe('status-created');
    expect(component.getOrderStatusClass(OrderStatus.Processing)).toBe('status-processing');
    expect(component.getOrderStatusClass(OrderStatus.Shipped)).toBe('status-shipped');
    expect(component.getOrderStatusClass(OrderStatus.Delivered)).toBe('status-delivered');
    expect(component.getOrderStatusClass(OrderStatus.Cancelled)).toBe('status-cancelled');
    expect(component.getOrderStatusClass('Unknown')).toBe('');
  });

  it('should get correct image URL for different types of URLs', () => {
    // Test relative URL
    expect(component.getImageUrl('/images/test.jpg')).toBe(`${environment.apiUrl}/images/test.jpg`);
    
    // Test data URL
    expect(component.getImageUrl('data:image/png;base64,test')).toBe('data:image/png;base64,test');
    
    // Test absolute URL
    expect(component.getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    
    // Test null.jpg
    expect(component.getImageUrl('products/null.jpg')).toBe('/assets/images/placeholder.png');
    
    // Test undefined
    expect(component.getImageUrl(undefined)).toBe('/assets/images/placeholder.png');
  });

  it('should close dialog when closeDialog is called', () => {
    component.closeDialog();
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  it('should handle item with null merchandise object', () => {
    // Create order with an item that has no merchandise object
    const orderWithMissingMerchandise: any = {
      ...mockOrder,
      orderItems: [
        {
          id: 3,
          orderId: 1,
          merchandiseId: 102,
          name: 'Test Product',
          size: 'S',
          quantity: 1,
          price: 19.99,
          merchandise: null
        }
      ]
    };
    
    // Setup mock and reset component
    orderServiceMock.getOrderById.and.returnValue(of(orderWithMissingMerchandise));
    component.order = null;
    
    // Fetch order details
    component.fetchOrderDetails();
    
    // Verify merchandise object was created - use non-null assertion
    const orderItem = component.order!.orderItems[0];
    expect(orderItem.merchandise).toBeDefined();
    expect(orderItem.merchandise!.id).toBe(102);
    expect(orderItem.merchandise!.name).toContain('102');
  });
}); 