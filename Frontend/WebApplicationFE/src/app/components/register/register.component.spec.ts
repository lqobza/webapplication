import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['register', 'login']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    // Setup TestBed
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    // Initialize authService.currentUserValue to null
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => null
    });

    // Create component
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate username length', () => {
    const usernameControl = component.registerForm.get('username');
    
    usernameControl?.setValue('ab'); // Too short
    expect(usernameControl?.valid).toBeFalse();
    
    usernameControl?.setValue('user123'); // Valid
    expect(usernameControl?.valid).toBeTrue();
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.get('email');
    
    emailControl?.setValue('invalid-email'); // Invalid format
    expect(emailControl?.valid).toBeFalse();
    
    emailControl?.setValue('valid@example.com'); // Valid format
    expect(emailControl?.valid).toBeTrue();
  });

  it('should validate password length', () => {
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('12345'); // Too short
    expect(passwordControl?.valid).toBeFalse();
    
    passwordControl?.setValue('password123'); // Valid
    expect(passwordControl?.valid).toBeTrue();
  });

  it('should validate password match', () => {
    // Set different passwords
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different'
    });
    
    // Trigger validation
    component.registerForm.get('confirmPassword')?.updateValueAndValidity();
    
    // Check validation
    expect(component.registerForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTrue();
    
    // Set matching passwords
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Trigger validation
    component.registerForm.get('confirmPassword')?.updateValueAndValidity();
    
    // Confirm no error
    expect(component.registerForm.get('confirmPassword')?.errors).toBeNull();
  });

  it('should register and then login on successful submission', () => {
    // Set valid form values
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Mock successful register and login
    authServiceMock.register.and.returnValue(of({ success: true }));
    authServiceMock.login.and.returnValue(of({ 
      id: 1, 
      username: 'testuser', 
      token: 'token123' 
    }));
    
    // Submit form
    component.onSubmit();
    
    // Verify register was called with correct values
    expect(authServiceMock.register).toHaveBeenCalledWith(
      'testuser',
      'test@example.com',
      'password123'
    );
    
    // Verify login was called
    expect(authServiceMock.login).toHaveBeenCalledWith(
      'testuser',
      'password123'
    );
    
    // Verify navigation
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show error message when registration fails', () => {
    // Set valid form values
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Mock failed registration
    authServiceMock.register.and.returnValue(
      throwError(() => ({ error: { message: 'Email already in use' } }))
    );
    
    // Submit form
    component.onSubmit();
    
    // Verify error is displayed
    expect(component.error).toBe('Email already in use');
    expect(component.loading).toBeFalse();
    
    // Verify login was not called
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should not call register when form is invalid', () => {
    // Leave form invalid
    component.onSubmit();
    
    // Verify register was not called
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });
}); 