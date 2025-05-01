import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    
    Object.defineProperty(authServiceMock, 'currentUserValue', {
      get: () => null
    });
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize  with empty email and password', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should be invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should mark email as invalid when incorrect format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalse();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('should redirect to returnUrl on successful login', () => {
    component.returnUrl = '/homepage';
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    authServiceMock.login.and.returnValue(of({ id: 1, username: 'testuser' }));
    
    component.onSubmit();
    
    expect(authServiceMock.login).toHaveBeenCalledWith(
      'test@example.com', 
      'password123'
    ); 
    expect(routerMock.navigate).toHaveBeenCalledWith(['/homepage']);
  });

  it('should display error on failed login', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password'
    });
    
    authServiceMock.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );
    
    component.onSubmit();
    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBeFalse();
  });
  
}); 