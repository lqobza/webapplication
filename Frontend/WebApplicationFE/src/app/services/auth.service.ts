import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlingService
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(user => {
          // store user details and jwt token in local storage
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }),
        catchError(this.errorHandler.handleError('login'))
      );
  }

  register(username: string, email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      username,
      email,
      password
    }).pipe(
      catchError(this.errorHandler.handleError('register'))
    );
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  /**
   * Get the JWT token from localStorage
   */
  private getToken(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser?.token || null;
  }

  /**
   * Get the current user ID from the JWT token
   */
  getCurrentUserId(): number {
    const token = this.getToken();
    if (!token) {
      console.error('No token found');
      return 0;
    }

    try {
      // Decode the JWT token to get the payload
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return 0;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      // Check multiple possible claim types for user ID
      const userId = payload.userId || payload.nameid || payload.sub || payload.id;
      
      if (!userId) {
        console.error('User ID not found in token payload');
        return 0;
      }

      return parseInt(userId, 10);
    } catch (error) {
      console.error('Error decoding token:', error);
      return 0;
    }
  }
} 