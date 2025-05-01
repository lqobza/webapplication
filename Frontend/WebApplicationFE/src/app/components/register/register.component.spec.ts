import { fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';


describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let formBuilder: FormBuilder;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['register', 'login']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    formBuilder = new FormBuilder();

    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => null
    });

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


  it('should initialize  with empty values', () => {
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate username length', () => {
    const usernameControl = component.registerForm.get('username');
    
    usernameControl?.setValue('aa');
    expect(usernameControl?.valid).toBeFalse();
    
    usernameControl?.setValue('user123');
    expect(usernameControl?.valid).toBeTrue();
  });

  it('should validate emailormat', () => {
    const emailControl = component.registerForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalse();
    
    emailControl?.setValue('valid@example.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('should validate password length', () => { 
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('12345');
    expect(passwordControl?.valid).toBeFalse();
    
    passwordControl?.setValue('password123');
    expect(passwordControl?.valid).toBeTrue();
  });


  it('should validate password match', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different'
    });
    
    component.registerForm.get('confirmPassword')?.updateValueAndValidity();
    expect(component.registerForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTrue();
  
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123'
    });
    component.registerForm.get('confirmPassword')?.updateValueAndValidity();
    expect(component.registerForm.get('confirmPassword')?.errors).toBeNull();
  });

  it('should register and show success message on successful submission', fakeAsync(() => {
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    authServiceMock.register.and.returnValue(of({}));
  
    component.onSubmit();
    expect(authServiceMock.register).toHaveBeenCalledWith(
      'testuser',
      'test@example.com',
      'password123'
    );
    
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Registration successful! Please login with your credentials.',
      'Close',
      jasmine.any(Object) 
    );
    

    tick(2000);
    
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  }));

  
  it('should show error when user exists ', () => {
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    

    const errorResponse = {
      status: 400,
      error: { message: 'User already exists.' }
    };
    authServiceMock.register.and.returnValue(throwError(() => errorResponse));
    
    component.onSubmit(); 
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'An account with this email already exists.',
      'Close',
      jasmine.any(Object)
    );
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should show error message for errors', () => {
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    const errorResponse = {
      status: 500,
      error: { message: 'Server error' }
    };
    authServiceMock.register.and.returnValue(throwError(() => errorResponse));
    
    component.onSubmit();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Registration failed. Please try again later.',
      'Close',
      jasmine.any(Object)
    );
  
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should not registert when form is invalid', () => {
    component.onSubmit();
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });
}); 