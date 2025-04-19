import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let formBuilder: FormBuilder;

  beforeEach(() => {
    // Create the spies
    authServiceMock = jasmine.createSpyObj('AuthService', ['register', 'login']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    formBuilder = new FormBuilder();

    // Define the currentUserValue getter
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => null
    });

    // Create the component directly
    component = new RegisterComponent(
      authServiceMock,
      routerMock,
      formBuilder,
      snackBarMock
    );
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

  it('should register and show success message on successful submission', fakeAsync(() => {
    // Set valid form values
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Mock successful register
    authServiceMock.register.and.returnValue(of({}));
    
    // Submit form
    component.onSubmit();
    
    // Verify register was called with correct values
    expect(authServiceMock.register).toHaveBeenCalledWith(
      'testuser',
      'test@example.com',
      'password123'
    );
    
    // Verify snackbar was opened with success message
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Registration successful! Please login with your credentials.',
      'Close',
      jasmine.any(Object)
    );
    
    // Fast-forward setTimeout
    tick(2000);
    
    // Verify navigation to login page
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should show error message when user already exists', () => {
    // Set valid form values
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Mock 400 error with "User already exists" message
    const errorResponse = {
      status: 400,
      error: { message: 'User already exists.' }
    };
    authServiceMock.register.and.returnValue(throwError(() => errorResponse));
    
    // Submit form
    component.onSubmit();
    
    // Verify snackbar was opened with user exists message
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'An account with this email already exists.',
      'Close',
      jasmine.any(Object)
    );
    
    // Verify login was not called
    expect(authServiceMock.login).not.toHaveBeenCalled();
    
    // Verify loading is set to false
    expect(component.loading).toBeFalse();
  });

  it('should show generic error message for other errors', () => {
    // Set valid form values
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Mock server error
    const errorResponse = {
      status: 500,
      error: { message: 'Server error' }
    };
    authServiceMock.register.and.returnValue(throwError(() => errorResponse));
    
    // Submit form
    component.onSubmit();
    
    // Verify snackbar was opened with general error message
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Registration failed. Please try again later.',
      'Close',
      jasmine.any(Object)
    );
    
    // Verify login was not called
    expect(authServiceMock.login).not.toHaveBeenCalled();
    
    // Verify loading is set to false
    expect(component.loading).toBeFalse();
  });

  it('should not call register when form is invalid', () => {
    // Leave form invalid
    component.onSubmit();
    
    // Verify register was not called
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });
}); 