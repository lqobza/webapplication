import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['login']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    
    activatedRouteMock = {
      snapshot: {
        queryParams: {}
      },
      queryParams: of({})
    };

    // Set up the component for testing
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    // Create the component
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    
    // Initialize authService.currentUserValue to null
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => null
    });
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty email and password', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should mark form as invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should mark email as invalid when format is incorrect', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalse();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('should redirect to returnUrl on successful login', () => {
    // Set up the return URL
    component.returnUrl = '/dashboard';
    
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Mock successful login
    authServiceMock.login.and.returnValue(of({ id: 1, username: 'testuser' }));
    
    // Submit the form
    component.onSubmit();
    
    // Verify login service was called with correct values
    expect(authServiceMock.login).toHaveBeenCalledWith(
      'test@example.com', 
      'password123'
    );
    
    // Verify navigation occurred
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should display error on failed login', () => {
    // Set valid form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password'
    });
    
    // Mock failed login
    authServiceMock.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );
    
    // Submit the form
    component.onSubmit();
    
    // Verify error is displayed
    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBeFalse();
  });

  it('should not call login service when form is invalid', () => {
    // Leave form invalid (empty)
    component.onSubmit();
    
    // Verify login service was not called
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should display session expired message when URL has expired param', () => {
    // Simulate route with expired=true parameter
    activatedRouteMock.queryParams = of({ expired: 'true' });
    
    // Call ngOnInit to process the route parameters
    component.ngOnInit();
    
    // Verify the error message
    expect(component.errorMessage).toBe('Your session has expired. Please log in again.');
  });
}); 