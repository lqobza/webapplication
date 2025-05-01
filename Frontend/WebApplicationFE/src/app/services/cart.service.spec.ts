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
    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getCurrentUserId']);
    merchandiseServiceMock = jasmine.createSpyObj('MerchandiseService', ['getMerchandiseById']);


    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getCurrentUserId.and.returnValue(1);
    
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


    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
    
    localStorage.clear();
    
    service.clearCart();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addToCart', () => {
    beforeEach(() => {
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should add a new item to cart', () => {
      const newItem = {
        merchId: 1, 
        name: 'test tshirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      }; 

      service.addToCart(newItem);
      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].merchId).toBe(1);
        expect(items[0].name).toBe('test tshirt');
        expect(items[0].size).toBe('M');
        
        const storedItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        expect(storedItems.length).toBe(1);
      });
    });

    it('should increase quantity when adding an existingitem', () => {
      const item = {
        merchId: 1,
        name: 'test tshirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      
      service.addToCart(item);
      service.addToCart(item);
      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].quantity).toBe(2);
      });
    });

    it('should add custom product to cart ', () => {
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      const customItem = {
        id: 'custom123',
        name: 'Custom Design',
        size: 'L',
        quantity: 1,
        price: 30, 
        frontImage: 'front.jpg',
        backImage: 'back.jpg',
        isCustom: true
      };
      service.addToCart(customItem);

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
    it('should remove item from cart', () => {
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      const item: CartItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      service.getCartItems().subscribe(items => {
        if (items.length > 0) {
          service.removeItem(items[0]);
        }
      });

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(0);
      });
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity', () => {
      const item: CartItem = {
        merchId: 1,
        name: 'Test T-Shirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      let cartItems: CartItem[] = [];
      service.getCartItems().subscribe(items => {
        cartItems = items;
      });
      service.updateQuantity(cartItems[0], 3);

      let updatedQuantity = 0;
      service.getCartItems().subscribe(items => {
        updatedQuantity = items[0].quantity;
      });
      
      expect(updatedQuantity).toBe(3);
    });

    it('should not allow  less than 1', () => {
      const item: CartItem = {
        merchId: 1,
        name: 'test tshirt',
        size: 'M',
        quantity: 2,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      let cartItems: CartItem[] = [];
      service.getCartItems().subscribe(items => {
        cartItems = items;
      });
      
      service.updateQuantity(cartItems[0], 0);

      let currentQuantity = 0;
      service.getCartItems().subscribe(items => {
        currentQuantity = items[0].quantity;
      });
      
      expect(currentQuantity).toBe(2); 
    });
  });


  describe('getTotalPrice', () => {
    beforeEach(() => {
      localStorage.removeItem('cartItems');
      service.clearCart();
    });

    
    it('should calculate correct total price', () => {
      const items = [
        {
          merchId: 1,
          name: 'item1',
          size: 'M',
          quantity: 2,
          price: 25,
          imageUrl: 'item1.jpg'
        },
        {
          merchId: 2,
          name: 'item2',
          size: 'L',
          quantity: 1,
          price: 30,
          imageUrl: 'item2.jpg'
        } 
      ];
  
      items.forEach(item => service.addToCart(item));
      const totalPrice = service.getTotalPrice();
    
      expect(totalPrice).toBe(80);
    });
  });

  describe('clearCart', () => {
    beforeEach(() => {
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should clear all items from cart', () => {
      const items = [
        {
          merchId: 1,
          name: 'item1',
          size: 'M',
          quantity: 2,
          price: 25,
          imageUrl: 'item1.jpg'
        },
        {
          merchId: 2,
          name: 'item2',
          size: 'L',
          quantity: 1,
          price: 30,
          imageUrl: 'item2.jpg'
        }
      ];

      items.forEach(item => service.addToCart(item));
      let itemCount = 0;
      service.getCartItems().subscribe(cartItems => {
        itemCount= cartItems.length;
      });
      expect(itemCount).toBe(2);
      
      service.clearCart();
      let isEmpty = false;
      service.getCartItems().subscribe(cartItems => {
        isEmpty = cartItems.length ===0;
      });
      expect(isEmpty).toBeTrue();
      
      //check local storage is ckleared
      const storedItems = localStorage.getItem('cartItems');
      expect(storedItems).toBeNull();
    });
  });

  describe('isCartEmpty', () => {
    it('should return true when cart is empty', () => {
      localStorage.removeItem('cartItems');
      service.clearCart();
      expect(service.isCartEmpty()).toBeTrue();
    });

    it('should return false when cart has items', () => {
      localStorage.removeItem('cartItems');
      service.clearCart();
      
      const item: CartItem = {
        merchId: 1,
        name: 'test tshirt',
        size: 'M',
        quantity: 1,
        price: 25,
        imageUrl: 'test.jpg'
      };
      service.addToCart(item);
      
      expect(service.isCartEmpty()).toBeFalse();
    });
  });

  describe('createOrder', () => {
    beforeEach(() => {
      localStorage.removeItem('cartItems');
      service.clearCart();
    });
    
    it('should create order with correct data', () => {
      const items = [
        {
          merchId: 1,
          name: 'item1',
          size: 'M',
          quantity: 2,
          price: 25,
          imageUrl: 'item1.jpg'
        }
      ];
      
      items.forEach(item => service.addToCart(item));
      
      const customerName = 'example name';
      const customerEmail = 'example@example.com';
      const customerAddress = '123 street';
      
      service.createOrder(customerName, customerEmail, customerAddress).subscribe();
      
      const request = httpMock.expectOne(`${environment.apiUrl}/api/order/create`);
      expect(request.request.method).toBe('POST');
      
      const reqBody = request.request.body;
      expect(reqBody.CustomerName).toBe(customerName);
      expect(reqBody.CustomerEmail).toBe(customerEmail);
      expect(reqBody.CustomerAddress).toBe(customerAddress);
      expect(reqBody.userId).toBe(1);
      expect(reqBody.Items.length).toBe(1);
      expect(reqBody.Items[0].MerchId).toBe(1);
      expect(reqBody.Items[0].Quantity).toBe(2); 
       
      request.flush({ success: true });

    });
    
  });
}); 
