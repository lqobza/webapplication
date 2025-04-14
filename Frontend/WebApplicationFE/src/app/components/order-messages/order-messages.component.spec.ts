import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OrderMessagesComponent } from './order-messages.component';
import { OrderService } from '../../services/order.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OrderMessage, OrderMessageCreate } from '../../models/order-message.model';

describe('OrderMessagesComponent', () => {
  let component: OrderMessagesComponent;
  let fixture: ComponentFixture<OrderMessagesComponent>;
  let orderServiceMock: jasmine.SpyObj<OrderService>;

  // Mock messages data
  const mockMessages: OrderMessage[] = [
    {
      id: 1,
      orderId: 1,
      content: 'Hello, I have a question about my order.',
      timestamp: '2023-05-15T10:30:00',
      isFromAdmin: false
    },
    {
      id: 2,
      orderId: 1,
      content: 'We are processing your order, it will be shipped soon.',
      timestamp: '2023-05-15T11:45:00',
      isFromAdmin: true
    }
  ];

  beforeEach(async () => {
    orderServiceMock = jasmine.createSpyObj('OrderService', [
      'getOrderMessages', 'addOrderMessage'
    ]);

    // Setup default mock returns
    orderServiceMock.getOrderMessages.and.returnValue(of(mockMessages));
    orderServiceMock.addOrderMessage.and.returnValue(of({
      id: 3,
      orderId: 1,
      content: 'Thank you for the update!',
      timestamp: new Date().toISOString(),
      isFromAdmin: false
    } as OrderMessage));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        OrderMessagesComponent
      ],
      providers: [
        { provide: OrderService, useValue: orderServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderMessagesComponent);
    component = fixture.componentInstance;
    component.orderId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load messages on init', () => {
    expect(orderServiceMock.getOrderMessages).toHaveBeenCalledWith(1);
    expect(component.messages).toEqual(mockMessages);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading messages', () => {
    // Reset the component
    component.messages = [];
    orderServiceMock.getOrderMessages.and.returnValue(throwError(() => new Error('Server error')));
    
    // Call the method
    component.loadMessages();
    
    // Verify error handling
    expect(component.error).toBe('Failed to load messages. Please try again.');
    expect(component.loading).toBeFalse();
    expect(component.messages).toEqual([]);
  });

  it('should not send empty messages', () => {
    // Set empty message
    component.newMessage = '   ';
    
    // Try to send
    component.sendMessage();
    
    // Verify message was not sent
    expect(orderServiceMock.addOrderMessage).not.toHaveBeenCalled();
  });

  it('should send a message as customer', () => {
    // Setup message
    component.newMessage = 'Thank you for the update!';
    component.isAdminMode = false;
    
    // Send message
    component.sendMessage();
    
    // Verify message was sent with correct data
    expect(orderServiceMock.addOrderMessage).toHaveBeenCalledWith(1, {
      orderId: 1,
      content: 'Thank you for the update!',
      isFromAdmin: false
    } as OrderMessageCreate);
    
    // Verify component state after sending
    expect(component.newMessage).toBe('');
    expect(component.loading).toBeFalse();
    expect(component.messages.length).toBe(3);
  });

  it('should send a message as admin', () => {
    // Setup message
    component.newMessage = 'Your order has been shipped.';
    component.isAdminMode = true;
    
    // Send message
    component.sendMessage();
    
    // Verify message was sent with correct data
    expect(orderServiceMock.addOrderMessage).toHaveBeenCalledWith(1, {
      orderId: 1,
      content: 'Your order has been shipped.',
      isFromAdmin: true
    } as OrderMessageCreate);
  });

  it('should handle error when sending message', () => {
    // Setup message and mock error
    component.newMessage = 'Test message';
    orderServiceMock.addOrderMessage.and.returnValue(throwError(() => new Error('Server error')));
    
    // Spy on window.alert
    spyOn(window, 'alert');
    
    // Send message
    component.sendMessage();
    
    // Verify error handling
    expect(window.alert).toHaveBeenCalledWith('Failed to send message. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('should format date correctly', () => {
    const dateString = '2023-05-15T10:30:00';
    const formattedDate = component.formatDate(dateString);
    
    // The exact format will depend on the user's locale, so we'll check for basic formatting
    expect(formattedDate).toContain('2023');
    expect(formattedDate).toContain('May');
    expect(formattedDate).toContain('15');
  });

  it('should handle invalid date', () => {
    const invalidDate = 'not-a-date';
    const formattedDate = component.formatDate(invalidDate);
    expect(formattedDate).toBe('Invalid Date');
  });

  it('should reload messages when orderId changes', () => {
    // Reset spy call counts
    orderServiceMock.getOrderMessages.calls.reset();
    
    // Simulate orderId input change
    component.ngOnChanges({
      orderId: {
        currentValue: 2,
        previousValue: 1,
        firstChange: false,
        isFirstChange: () => false
      }
    });
    
    // Verify messages were reloaded
    expect(orderServiceMock.getOrderMessages).toHaveBeenCalled();
  });

  it('should not reload messages on first change', () => {
    // Reset spy call counts
    orderServiceMock.getOrderMessages.calls.reset();
    
    // Simulate first change
    component.ngOnChanges({
      orderId: {
        currentValue: 1,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    
    // Verify messages were not reloaded (since they're already loaded in ngOnInit)
    expect(orderServiceMock.getOrderMessages).not.toHaveBeenCalled();
  });

  it('should setup auto refresh on init', fakeAsync(() => {
    // Reset the component and spy
    component.ngOnDestroy(); // Clean up existing subscription
    orderServiceMock.getOrderMessages.calls.reset();
    
    // Reinitialize
    component.ngOnInit();
    
    // Fast-forward time to trigger refresh
    tick(30000);
    
    // Verify refresh happened
    expect(orderServiceMock.getOrderMessages).toHaveBeenCalledTimes(2); // Once for initial load and once for refresh
    
    // Clean up to avoid memory leaks
    component.ngOnDestroy();
  }));

  it('should clean up subscription on destroy', () => {
    // Create spy on subscription
    const unsubscribeSpy = spyOn(component.refreshSubscription!, 'unsubscribe');
    
    // Destroy component
    component.ngOnDestroy();
    
    // Verify subscription was cleaned up
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
}); 