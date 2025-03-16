import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Merchandise } from '../models/merchandise.model';
import { Category } from '../models/category.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { catchError } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';
import { MerchandiseImage } from '../models/merchandise-image.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MerchandiseService {
  private apiUrl = `${environment.apiUrl}/api/merchandise`;

  constructor(private http: HttpClient, private errorHandlingService: ErrorHandlingService) { }

  getAllMerchandise(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Merchandise>> {
    return this.http.get<PaginatedResponse<Merchandise>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  insertMerchandise(merchandise: Merchandise): Observable<any> {
    return this.http.post(`${this.apiUrl}`, merchandise);
  }

  getMerchandiseById(merchId: number): Observable<Merchandise> {
    return this.http.get<Merchandise>(`${this.apiUrl}/${merchId}`);
  }

  deleteMerchandiseById(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateMerchandise(id: number, merchandise: Partial<Merchandise>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, merchandise);
  }

  getMerchandiseBySize(size: string): Observable<Merchandise[]> {
    return this.http.get<Merchandise[]>(`${this.apiUrl}/size/${size}`);
  }

  getMerchandiseByCategory(category: number): Observable<Merchandise[]> {
    return this.http.get<Merchandise[]>(`${this.apiUrl}/category/${category}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getSizes(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sizes/${categoryId}`)
      .pipe(
        catchError(error => {
          return new Observable<any[]>(observer => {
            observer.next([]);
            observer.complete();
          });
        })
      );
  }

  getBrands(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/brands`);
  }

  /**
   * Check if there is sufficient stock for a merchandise item
   * @param merchId The merchandise ID
   * @param size The size
   * @param quantity The quantity to check
   * @returns Observable with the check result
   */
  checkStockAvailability(merchId: number, size: string, quantity: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${merchId}/stock/${size}?quantity=${quantity}`);
  }

  uploadImage(merchandiseId: number, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    
    return this.http.post(
      `${this.apiUrl}/${merchandiseId}/images`, 
      formData
    );
  }

  getMerchandiseImages(merchandiseId: number): Observable<MerchandiseImage[]> {
    return this.http.get<MerchandiseImage[]>(`${this.apiUrl}/images/${merchandiseId}`)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return new Observable<MerchandiseImage[]>(observer => {
              observer.next([]);
              observer.complete();
            });
          }
          return this.errorHandlingService.handleError<MerchandiseImage[]>('getMerchandiseImages', [])(error);
        })
      );
  }

  deleteMerchandise(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createMerchandise(merchandise: Omit<Merchandise, 'id'>): Observable<Merchandise> {
    return new Observable<Merchandise>(observer => {
      this.http.post<Merchandise>(`${this.apiUrl}`, merchandise).subscribe({
        next: (response) => {
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}
