import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MerchandiseDetailComponent } from './merchandise-detail.component';
import { MerchandiseService } from '../../services/merchandise.service';
import { RatingService } from '../../services/rating.service';
import { CartService } from '../../services/cart.service';
import { environment } from 'src/environments/environment';

describe('MerchandiseDetailComponent', () => {
  let component: MerchandiseDetailComponent;
  let fixture: ComponentFixture<MerchandiseDetailComponent>;
  let merchandiseServiceMock: jasmine.SpyObj<MerchandiseService>;
  let ratingServiceMock: jasmine.SpyObj<RatingService>;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  const mockMerchandise = {
    id: 1,
    name: 'Test T-Shirt',
    description: 'Description of test t-shirt',
    price: 29.99,
    categoryId: 1,
    categoryName: 'T-Shirts',
    sizes: [
      { size: 'S', inStock: 5 },
      { size: 'M', inStock: 10 },
      { size: 'L', inStock: 0 }
    ],
    images: [
      { id: 1, merchId: 1, imageUrl: '/images/test-shirt.jpg', isPrimary: true },
      { id: 2, merchId: 1, imageUrl: '/images/test-shirt-alt.jpg', isPrimary: false }
    ],
    ratings: [
      { id: 1, merchId: 1, userId: 101, rating: 4, description: 'Great product', date: new Date() }
    ]
  };

  beforeEach(async () => {
    // Create spies for all the services
    merchandiseServiceMock = jasmine.createSpyObj('MerchandiseService', 
      ['getMerchandiseById', 'getMerchandiseImages']);
    ratingServiceMock = jasmine.createSpyObj('RatingService', ['insertRating']);
    cartServiceMock = jasmine.createSpyObj('CartService', ['addToCart']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Set up the activated route mock
    activatedRouteMock = {
      paramMap: of(convertToParamMap({ id: '1' }))
    };

    // Set up default return values for service methods
    merchandiseServiceMock.getMerchandiseById.and.returnValue(of(mockMerchandise));
    merchandiseServiceMock.getMerchandiseImages.and.returnValue(of(mockMerchandise.images));
    
    // Set up mock returns for snackbar
    const snackBarRefMock = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    snackBarRefMock.onAction.and.returnValue(of({}));
    snackBarMock.open.and.returnValue(snackBarRefMock);

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: MerchandiseService, useValue: merchandiseServiceMock },
        { provide: RatingService, useValue: ratingServiceMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MerchandiseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load merchandise details on init', () => {
    expect(merchandiseServiceMock.getMerchandiseById).toHaveBeenCalledWith(1);
    expect(component.merchandise).toEqual(mockMerchandise);
    expect(component.isLoading).toBeFalse();
  });

  it('should initialize with first available size selected', () => {
    expect(component.selectedSize).toBe('S');
    expect(component.inStock).toBe(5);
    expect(component.hasMultipleSizes).toBeTrue();
  });

  it('should load images', () => {
    expect(merchandiseServiceMock.getMerchandiseImages).toHaveBeenCalledWith(1);
    expect(component.merchandise?.images).toEqual(mockMerchandise.images);
  });

  it('should update stock when changing size', () => {
    // Change to M size
    component.selectedSize = 'M';
    component.onSizeChange();
    
    // Should update inStock and reset quantity
    expect(component.inStock).toBe(10);
    expect(component.quantity).toBe(1);
  });

  it('should identify out of stock sizes', () => {
    // L size is out of stock
    component.selectedSize = 'L';
    component.onSizeChange();
    
    expect(component.isOutOfStock()).toBeTrue();
  });

  it('should limit quantity to maximum available stock', () => {
    component.selectedSize = 'S'; // 5 in stock
    component.onSizeChange();
    
    expect(component.maxQuantity).toBe(5);
    
    // Try setting quantity above max
    component.quantity = 10;
    component.onQuantityChange();
    
    expect(component.isAddToCartDisabled).toBeTrue();
  });

  it('should increment and decrement quantity', () => {
    component.selectedSize = 'M'; // 10 in stock
    component.onSizeChange();
    
    // Initial quantity should be 1
    expect(component.quantity).toBe(1);
    
    // Increment twice
    component.incrementQuantity();
    component.incrementQuantity();
    expect(component.quantity).toBe(3);
    
    // Decrement once
    component.decrementQuantity();
    expect(component.quantity).toBe(2);
    
    // Cannot decrement below 1
    component.quantity = 1;
    component.decrementQuantity();
    expect(component.quantity).toBe(1);
  });

  it('should add item to cart', () => {
    component.selectedSize = 'M';
    component.quantity = 2;
    component.addToCart();
    
    expect(cartServiceMock.addToCart).toHaveBeenCalledWith(jasmine.objectContaining({
      merchId: 1,
      name: 'Test T-Shirt',
      size: 'M',
      quantity: 2,
      price: 29.99
    }));
    
    expect(snackBarMock.open).toHaveBeenCalledWith('Added to cart!', 'View Cart', jasmine.any(Object));
  });

  it('should prevent adding to cart without size', () => {
    component.selectedSize = undefined;
    component.addToCart();
    
    expect(cartServiceMock.addToCart).not.toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Please select a size', 'Close', jasmine.any(Object));
  });

  it('should prevent adding to cart with quantity > stock', () => {
    component.selectedSize = 'S'; // 5 in stock
    component.quantity = 10; // Try to add more than available
    component.addToCart();
    
    expect(cartServiceMock.addToCart).not.toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Sorry, only 5 items available in this size', 'Close', jasmine.any(Object));
  });

  it('should navigate to cart when snackbar action is clicked', () => {
    // Mock the snackbar reference's onAction to return a user clicked event
    const snackBarRefMock = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    snackBarRefMock.onAction.and.returnValue(of({}));
    snackBarMock.open.and.returnValue(snackBarRefMock);
    
    component.selectedSize = 'M';
    component.quantity = 1;
    component.addToCart();
    
    expect(routerMock.navigate).toHaveBeenCalledWith(['/cart']);
  });

  it('should handle error when loading merchandise', () => {
    // Recreate component with error response
    merchandiseServiceMock.getMerchandiseById.and.returnValue(
      throwError(() => new Error('Server error'))
    );
    
    // Create a new instance with the error mock
    fixture = TestBed.createComponent(MerchandiseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.errorMessage).toBe('Server error');
    expect(component.isLoading).toBeFalse();
    expect(component.merchandise).toBeUndefined();
  });

  it('should get correct primary image URL', () => {
    const primaryImage = mockMerchandise.images[0];
    expect(component.getPrimaryImageUrl()).toContain(primaryImage.imageUrl);
  });
}); 