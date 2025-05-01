import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
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
    it('should login user and store userdata in local storage ', () => {
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
        
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        expect(storedUser).toEqual(mockUser);
        expect(service.currentUserValue).toEqual(mockUser);
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ email, password}); 
      request.flush(mockUser);
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

      const request = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ username, email, password });
      request.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should remove userdata from local storage and update current usr', () => {
      const user = { id: 1, username: 'test', token: 'token123' };
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      service.login('test@example.com', 'password').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(user);
      expect(service.currentUserValue).toEqual(user);
      
      service.logout();
      
      expect(localStorage.getItem('currentUser')).toBeNull();
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
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { userId: '1', exp: futureTime  };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'test', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should return false and logout when token is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
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
    it('should return 0 when user isnt logged in', () => {
      localStorage.clear();
      service.logout();
      expect(service.getCurrentUserId()).toBe(0);
    });

    it('should return the correct userID from token', () => {
      const payload = { userId: '42' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 42, username: 'test', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      
      expect(service.getCurrentUserId()).toBe(42);
    });

  });

  describe('isAdmin', () => {
    it('should return false when no user is logged in', () => {
      localStorage.clear();
      service.logout();
      expect(service.isAdmin()).toBeFalse();
    });

    it('should return true when user is admin', () => {
      const payload = { userId: '1', role: 'Admin' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'admin', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);
      expect(service.isAdmin()).toBeTrue();
    });

    it('should return false when user isnt admin', () => {
      const payload = { userId: '1', role: 'User' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const user = { id: 1, username: 'user', token: mockToken };
      localStorage.setItem('currentUser', JSON.stringify(user));
      service['currentUserSubject'].next(user);

      expect(service.isAdmin()).toBeFalse();
    });
  });
});
