import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CartService } from './cart.service';
import { MerchandiseService } from './merchandise.service';
import { AuthService } from './auth.service';
import { CartItem } from '../models/cartitem.model';
import { environment } from 'src/environments/environment';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let merchandiseServiceMock: jasmine.SpyObj<MerchandiseService>;

  beforeEach(() => {
    // Create mocks for services that CartService depends on
    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getCurrentUserId']);
    merchandiseServiceMock = jasmine.createSpyObj('MerchandiseService', ['getMerchandiseById']);

    // Default behavior for mocks
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getCurrentUserId.and.returnValue(1);
    
    // Setup the TestBed with our mocks
    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: MerchandiseService, useValue: merchandiseServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    // Get instances of service and http mock
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
    
    // Also clear the cart in the service
    service.clearCart();
  });

  afterEach(() => {
    // Verify that no unmatched requests are outstanding
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addToCart', () => {
    beforeEach(() => {
      // Ensure cart is empty before each test
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should add a new item to cart', () => {
      // Arrange
      const newItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };

      // Act
      service.addToCart(newItem);

      // Assert - use done callback to handle async
      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].merchId).toBe(1);
        expect(items[0].name).toBe('Test T-Shirt');
        expect(items[0].size).toBe('M');
        
        // Verify localStorage was updated
        const storedItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        expect(storedItems.length).toBe(1);
      });
    });

    it('should increment quantity when adding an existing item', () => {
      // Arrange - Add item first
      const item = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      
      // Act - Add same item twice
      service.addToCart(item);
      service.addToCart(item);

      // Assert - Should have 1 item with quantity 2
      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].quantity).toBe(2);
      });
    });

    it('should add custom product to cart correctly', () => {
      // Clear cart first to ensure we're starting fresh
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      // Arrange
      const customItem = {
        id: 'custom-123',
        name: 'Custom Design',
        size: 'L',
        quantity: 1,
        price: 30,
        frontImage: 'front.jpg',
        backImage: 'back.jpg',
        isCustom: true
      };

      // Act
      service.addToCart(customItem);

      // Assert
      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].isCustom).toBeTrue();
        expect(items[0].name).toBe('Custom Design');
        expect(items[0].size).toBe('L');
        expect(items[0].frontImage).toBe('front.jpg');
        expect(items[0].backImage).toBe('back.jpg');
      });
    });
  });

  describe('removeItem', () => {
    it('should remove an item from cart', () => {
      // Clear cart first
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      // Arrange - Add item first
      const item: CartItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      // Act - Remove the item
      service.getCartItems().subscribe(items => {
        if (items.length > 0) {
          service.removeItem(items[0]);
        }
      });

      // Assert - Cart should be empty now
      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(0);
      });
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      // Arrange - Add item first
      const item: CartItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      // Act - Get the item reference and update its quantity
      let cartItems: CartItem[] = [];
      service.getCartItems().subscribe(items => {
        cartItems = items;
      });
      
      service.updateQuantity(cartItems[0], 3);

      // Assert - Check the updated quantity
      let updatedQuantity = 0;
      service.getCartItems().subscribe(items => {
        updatedQuantity = items[0].quantity;
      });
      
      expect(updatedQuantity).toBe(3);
    });

    it('should not update quantity if less than 1', () => {
      // Arrange - Add item first
      const item: CartItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 2,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      // Act - Try to set quantity to 0
      let cartItems: CartItem[] = [];
      service.getCartItems().subscribe(items => {
        cartItems = items;
      });
      
      service.updateQuantity(cartItems[0], 0);

      // Assert - Quantity should remain 2
      let currentQuantity = 0;
      service.getCartItems().subscribe(items => {
        currentQuantity = items[0].quantity;
      });
      
      expect(currentQuantity).toBe(2);
    });
  });

  describe('getTotalPrice', () => {
    beforeEach(() => {
      // Ensure cart is empty before each test
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should calculate correct total price', () => {
      // Arrange
      const items = [
        {
          merchId: 1,
          name: 'Item 1',
          size: 'M',
          quantity: 2,
          price: 25,
          imageUrl: 'item1.jpg'
        },
        {
          merchId: 2,
          name: 'Item 2',
          size: 'L',
          quantity: 1,
          price: 30,
          imageUrl: 'item2.jpg'
        }
      ];
      
      items.forEach(item => service.addToCart(item));
      
      // Act
      const totalPrice = service.getTotalPrice();
      
      // Assert - Expected: (2*25) + (1*30) = 80
      expect(totalPrice).toBe(80);
    });
  });

  describe('clearCart', () => {
    beforeEach(() => {
      // Ensure cart is empty before the test
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should clear all items from cart', () => {
      // Arrange - Add some items
      const items = [
        {
          merchId: 1,
          name: 'Item 1',
          size: 'M',
          quantity: 1,
          price: 25,
          imageUrl: 'item1.jpg'
        },
        {
          merchId: 2,
          name: 'Item 2',
          size: 'L',
          quantity: 1,
          price: 30,
          imageUrl: 'item2.jpg'
        }
      ];
      
      items.forEach(item => service.addToCart(item));
      
      // Verify items were added
      let itemCount = 0;
      service.getCartItems().subscribe(cartItems => {
        itemCount = cartItems.length;
      });
      expect(itemCount).toBe(2);
      
      // Act
      service.clearCart();
      
      // Assert - Cart should be empty
      let isEmpty = false;
      service.getCartItems().subscribe(cartItems => {
        isEmpty = cartItems.length === 0;
      });
      expect(isEmpty).toBeTrue();
      
      // Check localStorage was cleared too
      const storedItems = localStorage.getItem('cartItems');
      expect(storedItems).toBeNull();
    });
  });

  describe('isCartEmpty', () => {
    it('should return true when cart is empty', () => {
      // Make sure the cart is empty first
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      // Act & Assert
      expect(service.isCartEmpty()).toBeTrue();
    });

    it('should return false when cart has items', () => {
      // Make sure the cart is empty first
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      // Arrange - Add an item to cart
      const item: CartItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      // Act & Assert
      expect(service.isCartEmpty()).toBeFalse();
    });
  });

  describe('createOrder', () => {
    beforeEach(() => {
      // Ensure cart is empty before each test
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should create an order with correct data', () => {
      // Arrange
      const items = [
        {
          merchId: 1,
          name: 'Item 1',
          size: 'M',
          quantity: 2,
          price: 25,
          imageUrl: 'item1.jpg'
        }
      ];
      
      items.forEach(item => service.addToCart(item));
      
      // Order details
      const customerName = 'John Doe';
      const customerEmail = 'john@example.com';
      const customerAddress = '123 Main St';
      
      // Act
      service.createOrder(customerName, customerEmail, customerAddress).subscribe();
      
      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/create`);
      expect(req.request.method).toBe('POST');
      
      // Verify request body
      const reqBody = req.request.body;
      expect(reqBody.CustomerName).toBe(customerName);
      expect(reqBody.CustomerEmail).toBe(customerEmail);
      expect(reqBody.CustomerAddress).toBe(customerAddress);
      expect(reqBody.userId).toBe(1); // From mock
      expect(reqBody.Items.length).toBe(1);
      expect(reqBody.Items[0].MerchId).toBe(1);
      expect(reqBody.Items[0].Quantity).toBe(2);
      
      // Complete the HTTP request
      req.flush({ success: true });
    });
    
    it('should handle custom merchandise correctly', () => {
      // Arrange - Add a custom item
      const customItem = {
        id: 'custom-123',
        name: 'Custom Design',
        size: 'M',
        quantity: 1,
        price: 30,
        frontImage: 'data:image/png;base64,abc123',
        isCustom: true
      };
      
      service.addToCart(customItem);
      
      // Order details
      const customerName = 'Jane Smith';
      const customerEmail = 'jane@example.com';
      const customerAddress = '456 Elm St';
      
      // Act
      service.createOrder(customerName, customerEmail, customerAddress).subscribe();
      
      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/api/order/create`);
      
      // Verify custom item in request body
      const customItemInRequest = req.request.body.Items[0];
      expect(customItemInRequest.IsCustom).toBeTrue();
      expect(customItemInRequest.MerchandiseName).toBe('Custom Design');
      
      // Check the value without asserting the specific property name
      const hasExpectedImage = Object.values(customItemInRequest).includes('data:image/png;base64,abc123');
      expect(hasExpectedImage).toBeTrue();
      
      req.flush({ success: true });
    });
  });
}); 