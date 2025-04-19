import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ErrorHandlingService } from './error-handling.service';
import { environment } from 'src/environments/environment';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let errorHandlingServiceMock: jasmine.SpyObj<ErrorHandlingService>;

  beforeEach(() => {
    // Create a mock for the ErrorHandlingService that returns an observable of empty by default
    errorHandlingServiceMock = jasmine.createSpyObj('ErrorHandlingService', ['handleError']);
    // By default, just return the inner function that returns an empty observable
    errorHandlingServiceMock.handleError.and.returnValue(() => of(null));
    
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ErrorHandlingService, useValue: errorHandlingServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login a user and store user data in localStorage', () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      const mockUser = {
        id: 1,
        email: email,
        username: 'testuser',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJVc2VyIiwiZXhwIjoxNzA2MDkwMDgwfQ.jHdKw6EmfLfAKRm2aF8MdcENQdxQ6Jpb6sD75cXCUEY'
      };

      service.login(email, password).subscribe(response => {
        expect(response).toEqual(mockUser);
        
        // Check if user is stored in localStorage
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        expect(storedUser).toEqual(mockUser);
        
        // Check if currentUserValue is updated
        expect(service.currentUserValue).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      
      req.flush(mockUser);
    });

    it('should handle login error', () => {
      const email = 'invalid@example.com';
      const password = 'wrongpassword';

      // Setup the mock to return an error for this specific test
      errorHandlingServiceMock.handleError.and.callFake((operation) => {
        return () => throwError(() => new Error(operation + ' failed'));
      });

      let errorCaught = false;
      service.login(email, password).subscribe({
        next: () => fail('Expected error, not success'),
        error: (err) => {
          errorCaught = true;
          expect(err.message).toContain('login failed');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.error(new ErrorEvent('Unauthorized'));
      
      expect(errorCaught).toBeTrue();
      expect(errorHandlingServiceMock.handleError).toHaveBeenCalledWith('login');
    });
  });

  describe('register', () => {
    it('should register a new user', () => {
      const username = 'newuser';
      const email = 'newuser@example.com';
      const password = 'password123';
      
      const mockResponse = {
        success: true,
        message: 'User registered successfully',
        userId: 123
      };

      service.register(username, email, password).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username, email, password });
      
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear user data from localStorage and update currentUserSubject', () => {
      // Set up the initial state - user is logged in
      const user = { id: 1, username: 'test', token: 'token123' };
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Manual trigger of setting the current user
      service.login('test@example.com', 'password').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(user);
      
      // Verify initial state
      expect(service.currentUserValue).toEqual(user);
      
      // Perform logout
      service.logout();
      
      // Verify localStorage is cleared
      expect(localStorage.getItem('currentUser')).toBeNull();
      
      // Verify current user is null
      expect(service.currentUserValue).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no user is logged in', () => {
      localStorage.clear();
      service.logout();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return true when user has a valid token', () => {
      // Create a mock JWT token with future expiration
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
      const payload = { userId: '1', exp: futureTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'test', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should return false and logout when token is expired', () => {
      // Create a mock JWT token with past expiration
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour in the past
      const payload = { userId: '1', exp: pastTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'test', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      const logoutSpy = spyOn(service, 'logout').and.callThrough();
      
      expect(service.isLoggedIn()).toBeFalse();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('getCurrentUserId', () => {
    it('should return 0 when no user is logged in', () => {
      localStorage.clear();
      service.logout();
      expect(service.getCurrentUserId()).toBe(0);
    });

    it('should return the correct user ID from the token', () => {
      // Create a mock JWT token with userId in the payload
      const payload = { userId: '42' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 42, username: 'test', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.getCurrentUserId()).toBe(42);
    });

    it('should handle alternative ID field names in token', () => {
      // Create a mock JWT token with nameid in the payload
      const payload = { nameid: '99' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 99, username: 'test', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.getCurrentUserId()).toBe(99);
    });
  });

  describe('isAdmin', () => {
    it('should return false when no user is logged in', () => {
      localStorage.clear();
      service.logout();
      expect(service.isAdmin()).toBeFalse();
    });

    it('should return true when user has Admin role', () => {
      // Create a mock JWT token with Admin role
      const payload = { userId: '1', role: 'Admin' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'admin', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.isAdmin()).toBeTrue();
    });

    it('should return false when user has non-Admin role', () => {
      // Create a mock JWT token with User role
      const payload = { userId: '1', role: 'User' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'user', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.isAdmin()).toBeFalse();
    });

    it('should handle MS claims format for admin role', () => {
      // Create a mock JWT token with MS-specific claim format
      const payload = { 
        userId: '1', 
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin' 
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'admin', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.isAdmin()).toBeTrue();
    });
  });
});