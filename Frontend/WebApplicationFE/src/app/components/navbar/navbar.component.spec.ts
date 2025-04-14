import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideLocationMocks } from '@angular/common/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout', 'isAdmin', 'isLoggedIn']);
    cartServiceMock = jasmine.createSpyObj('CartService', ['clearCart']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        NavbarComponent
      ],
      providers: [
        provideRouter([], withComponentInputBinding()),
        provideLocationMocks(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: CartService, useValue: cartServiceMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    
    // Set default behavior for isLoggedIn
    authServiceMock.isLoggedIn.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout, clear cart, and navigate to home when logout is called', () => {
    // Setup spy on router navigate
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    
    // Call logout
    component.logout();
    
    // Verify expected methods were called
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should return email when user is logged in', () => {
    // Setup currentUserValue mock
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => ({ email: 'test@example.com' })
    });
    
    expect(component.userEmail).toBe('test@example.com');
  });

  it('should return empty string when user is not logged in', () => {
    // Setup currentUserValue mock to return null
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => null
    });
    
    expect(component.userEmail).toBe('');
  });

  it('should check admin status', () => {
    // Setup isAdmin to return true
    authServiceMock.isAdmin.and.returnValue(true);
    
    expect(component.isAdmin).toBeTrue();
    expect(authServiceMock.isAdmin).toHaveBeenCalled();
  });
}); 