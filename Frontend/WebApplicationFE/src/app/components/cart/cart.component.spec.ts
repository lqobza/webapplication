import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { CartComponent } from './cart.component';
import { CartService } from '../../services/cart.service';
import { MerchandiseService } from '../../services/merchandise.service';
import { AuthService } from '../../services/auth.service';
import { CartItem } from '../../models/cartitem.model';
import { Merchandise } from '../../models/merchandise.model';
import { environment } from 'src/environments/environment';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let merchandiseServiceMock: jasmine.SpyObj<MerchandiseService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let sanitizerMock: jasmine.SpyObj<DomSanitizer>;

  // Mock data
  const mockCartItems: CartItem[] = [
    {
      id: '1',
      merchId: 1,
      name: 'Test T-Shirt',
      price: 25.99,
      size: 'M',
      quantity: 2,
      imageUrl: '/images/tshirt.jpg'
    },
    {
      id: 'custom-1',
      merchId: 0,
      isCustom: true,
      name: 'Custom Product',
      price: 35.99,
      size: 'L',
      quantity: 1,
      frontImage: 'data:image/png;base64,test'
    }
  ];

  const mockMerchandise: Merchandise = {
    id: 1,
    name: 'Test T-Shirt',
    description: 'Test description',
    price: 25.99,
    categoryId: 1,
    categoryName: 'T-Shirts',
    sizes: ['S', 'M', 'L'],
    images: [
      { id: 1, merchId: 1, imageUrl: '/images/tshirt.jpg', isPrimary: true }
    ]
  };

  beforeEach(async () => {
    cartServiceMock = jasmine.createSpyObj('CartService', [
      'getCartItems', 'updateMerchandiseDetails', 'getMerchandiseDetails',
      'removeItem', 'clearCart', 'updateQuantity', 'getTotalPrice', 'createOrder'
    ]);
    
    merchandiseServiceMock = jasmine.createSpyObj('MerchandiseService', [
      'getMerchandiseById', 'checkStockAvailability'
    ]);
    
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'isLoggedIn', 'currentUserValue'
    ]);
    
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    
    sanitizerMock = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

    // Setup default mock returns
    cartServiceMock.getCartItems.and.returnValue(of(mockCartItems));
    cartServiceMock.getTotalPrice.and.returnValue(mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    merchandiseServiceMock.getMerchandiseById.and.returnValue(of(mockMerchandise));
    merchandiseServiceMock.checkStockAvailability.and.returnValue(of({ isAvailable: true, available: 10 }));
    authServiceMock.isLoggedIn.and.returnValue(true);
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => ({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJKb2huIERvZSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature' })
    });
    sanitizerMock.bypassSecurityTrustUrl.and.callFake(url => url);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterModule
      ],
      providers: [
        { provide: CartService, useValue: cartServiceMock },
        { provide: MerchandiseService, useValue: merchandiseServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: DomSanitizer, useValue: sanitizerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cart items on init', () => {
    expect(cartServiceMock.getCartItems).toHaveBeenCalled();
    expect(component.cartItems).toEqual(mockCartItems);
    expect(component.isLoading).toBeFalse();
  });

  it('should load user data on init when user is logged in', () => {
    expect(component.customerName).toBe('John Doe');
    expect(component.customerEmail).toBe('test@example.com');
  });

  it('should not load user data when user is not logged in', () => {
    // Reset the component
    authServiceMock.isLoggedIn.and.returnValue(false);
    component.customerName = '';
    component.customerEmail = '';
    
    // Call the method directly
    component.loadUserData();
    
    // Verify no data was loaded
    expect(component.customerName).toBe('');
    expect(component.customerEmail).toBe('');
  });

  it('should calculate total price correctly', () => {
    component.updateTotalPrice();
    // 25.99 * 2 + 35.99 * 1 = 87.97, rounded to 88
    expect(component.totalPrice).toBe(88);
  });

  it('should remove item from cart', () => {
    const itemToRemove = mockCartItems[0];
    component.removeItem(itemToRemove);
    expect(cartServiceMock.removeItem).toHaveBeenCalledWith(itemToRemove);
  });

  it('should clear cart', () => {
    component.clearCart();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('should update quantity with valid input', () => {
    const index = 0;
    const newQuantity = 3;
    component.updateQuantity(index, newQuantity);
    
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(mockCartItems[index], newQuantity);
    expect(merchandiseServiceMock.checkStockAvailability).toHaveBeenCalledWith(
      mockCartItems[index].merchId, 
      mockCartItems[index].size, 
      newQuantity
    );
  });

  it('should handle string input for quantity', () => {
    const index = 0;
    component.updateQuantity(index, '5');
    
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(mockCartItems[index], 5);
  });

  it('should handle invalid quantity input', () => {
    const index = 0;
    
    // Test with negative number
    component.updateQuantity(index, -1);
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(mockCartItems[index], 1);
    
    // Test with NaN
    component.updateQuantity(index, 'abc');
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(mockCartItems[index], 1);
    
    // Test with too large number
    component.updateQuantity(index, 101);
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(mockCartItems[index], 100);
  });

  it('should get image URL for regular items', () => {
    const url = component.getImageUrl(mockCartItems[0]);
    expect(url).toBe(`${environment.apiUrl}/images/tshirt.jpg`);
  });

  it('should get image URL for custom items', () => {
    const url = component.getImageUrl(mockCartItems[1]);
    expect(sanitizerMock.bypassSecurityTrustUrl).toHaveBeenCalledWith('data:image/png;base64,test');
  });

  it('should navigate to shop', () => {
    component.goToShop();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/merchandise']);
  });

  it('should create order successfully', () => {
    // Setup component
    component.customerName = 'John Doe';
    component.customerEmail = 'test@example.com';
    component.customerAddress = '123 Test St';
    
    // Mock successful order creation
    cartServiceMock.createOrder.and.returnValue(of({ id: 1, status: 'Pending' }));
    
    // Call createOrder
    component.createOrder();
    
    // Verify order creation
    expect(cartServiceMock.createOrder).toHaveBeenCalledWith(
      'John Doe', 
      'test@example.com', 
      '123 Test St'
    );
    expect(component.orderSuccess).toBeTrue();
    expect(component.orderSubmitting).toBeFalse();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('should handle order creation errors', () => {
    // Setup component
    component.customerName = 'John Doe';
    component.customerEmail = 'test@example.com';
    component.customerAddress = '123 Test St';
    
    // Mock order creation error
    const errorResponse = { 
      error: { message: 'Insufficient stock for item 1' }, 
      status: 400 
    };
    cartServiceMock.createOrder.and.returnValue(throwError(() => errorResponse));
    
    // Call createOrder
    component.createOrder();
    
    // Verify error handling
    expect(component.orderSuccess).toBeFalse();
    expect(component.orderSubmitting).toBeFalse();
    expect(component.orderError).toBe('Insufficient stock for item 1');
  });

  it('should validate customer details before creating order', () => {
    // Setup incomplete customer details
    component.customerName = '';
    component.customerEmail = 'test@example.com';
    component.customerAddress = '123 Test St';
    
    // Call createOrder
    component.createOrder();
    
    // Verify validation
    expect(component.orderError).toBe('Please fill in all customer details.');
    expect(component.orderSubmitting).toBeFalse();
    expect(cartServiceMock.createOrder).not.toHaveBeenCalled();
  });

  it('should validate cart has items before creating order', () => {
    // Setup complete customer details but empty cart
    component.customerName = 'John Doe';
    component.customerEmail = 'test@example.com';
    component.customerAddress = '123 Test St';
    component.cartItems = [];
    
    // Call createOrder
    component.createOrder();
    
    // Verify validation
    expect(component.orderError).toBe('Your cart is empty. Please add items before placing an order.');
    expect(component.orderSubmitting).toBeFalse();
    expect(cartServiceMock.createOrder).not.toHaveBeenCalled();
  });
}); 