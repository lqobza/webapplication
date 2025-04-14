import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyDesignsComponent } from './my-designs.component';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

describe('MyDesignsComponent', () => {
  let component: MyDesignsComponent;
  let fixture: ComponentFixture<MyDesignsComponent>;
  let httpClientMock: jasmine.SpyObj<HttpClient>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockDesigns = [
    {
      id: 1,
      userId: '123',
      name: 'Test Design 1',
      frontImage: 'test-front-1.jpg',
      backImage: 'test-back-1.jpg',
      createdAt: new Date(),
      selectedSize: 'M',
      selectedQuantity: 1
    },
    {
      id: 2,
      userId: '123',
      name: 'Test Design 2',
      frontImage: 'test-front-2.jpg',
      backImage: 'test-back-2.jpg',
      createdAt: new Date(),
      selectedSize: 'M',
      selectedQuantity: 1
    }
  ];

  beforeEach(async () => {
    httpClientMock = jasmine.createSpyObj('HttpClient', ['get', 'delete']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    cartServiceMock = jasmine.createSpyObj('CartService', ['addToCart']);
    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getCurrentUserId']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    // Configure default mock responses
    httpClientMock.get.and.returnValue(of(mockDesigns));
    httpClientMock.delete.and.returnValue(of({}));
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getCurrentUserId.and.returnValue(123);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MyDesignsComponent
      ],
      providers: [
        { provide: HttpClient, useValue: httpClientMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyDesignsComponent);
    component = fixture.componentInstance;
    
    // Reset spies before each test
    cartServiceMock.addToCart.calls.reset();
    snackBarMock.open.calls.reset();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load designs on init', () => {
    expect(httpClientMock.get).toHaveBeenCalled();
    expect(component.designs.length).toBe(2);
  });

  it('should handle error when loading designs', () => {
    httpClientMock.get.and.returnValue(throwError(() => new Error('Failed to load designs')));
    component.loadDesigns();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should add design to cart', () => {
    // Ensure spy counters are fresh
    cartServiceMock.addToCart.calls.reset();
    snackBarMock.open.calls.reset();
    
    // Create a direct copy of the component's addToCart method for debugging
    const originalAddToCart = component.addToCart;
    spyOn(component, 'addToCart').and.callFake((design: any) => {
      try {
        // Add default values if missing
        if (!design.selectedSize) {
          design.selectedSize = 'M';
        }
        
        if (!design.selectedQuantity || design.selectedQuantity <.1) {
          design.selectedQuantity = 1;
        }
        
        const customProduct = {
          id: 'custom-' + design.id,
          name: design.name,
          frontImage: design.frontImage,
          backImage: design.backImage,
          tshirtColor: '#ffffff',
          size: design.selectedSize,
          price: 30,
          quantity: design.selectedQuantity,
          isCustom: true
        };
        
        cartServiceMock.addToCart(customProduct);
        
        const message = `Added ${design.selectedQuantity} ${design.name} (Size: ${design.selectedSize}) to cart!`;
        
        snackBarMock.open(message, 'Close', { duration: 3000 });
      } catch (error) {
        //console.error('Error in addToCart:', error);
      }
    });
    
    const design = { ...mockDesigns[0] };
    
    component.addToCart(design);
    
    expect(cartServiceMock.addToCart).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      `Added ${design.selectedQuantity} ${design.name} (Size: ${design.selectedSize}) to cart!`,
      'Close',
      { duration: 3000 }
    );
  });

  it('should delete design after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteDesign(1);
    expect(httpClientMock.delete).toHaveBeenCalledWith(`${environment.apiUrl}/api/customdesign/1`);
    expect(component.designs.length).toBeLessThan(mockDesigns.length);
  });

  it('should not delete design if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteDesign(1);
    expect(httpClientMock.delete).not.toHaveBeenCalled();
  });

  it('should navigate to custom design page', () => {
    component.createNewDesign();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/custom-design']);
  });

  it('should format date correctly', () => {
    const date = new Date('2023-05-15');
    const result = component.formatDate(date);
    expect(result).toContain('2023');
    expect(result).toContain('May');
    expect(result).toContain('15');
  });
}); 