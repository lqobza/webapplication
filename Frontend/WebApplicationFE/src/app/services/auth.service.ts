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
    });
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.token) {
      return false;
    }
    
    try {
      const tokenParts = currentUser.token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          this.logout();
          return false;
        }
      }
      return true;
    } catch (error) {
      //console.error('Error checking token expiration:', error);
      return false;
    }
  }

  private getToken(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser?.token || null;
  }

  getCurrentUserId(): number {
    const token = this.getToken();
    if (!token) {
      //console.error('No token found');
      return 0;
    }

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        //console.error('Invalid token format');
        return 0;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.userId || payload.nameid || payload.sub || payload.id;
      
      if (!userId) {
        //console.error('User ID not found in token payload');
        return 0;
      }

      return parseInt(userId, 10);
    } catch (error) {
      //console.error('Error decoding token:', error);
      return 0;
    }
  }

  isAdmin(): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.token) {
      return false;
    }

    try {
      const tokenParts = currentUser.token.split('.');
      if (tokenParts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.role === 'Admin' || 
             payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Admin';
    } catch (error) {
      //console.error('Error checking admin status:', error);
      return false;
    }
  }
} 