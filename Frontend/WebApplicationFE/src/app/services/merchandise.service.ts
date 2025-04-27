import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Merchandise } from '../models/merchandise.model';
import { Category } from '../models/category.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { catchError } from 'rxjs/operators';
import { MerchandiseImage } from '../models/merchandise-image.model';
import { environment } from 'src/environments/environment';
import { MerchandiseSearch, SortOption } from '../models/merchandise-search.model';

@Injectable({
  providedIn: 'root'
})
export class MerchandiseService {
  private apiUrl = `${environment.apiUrl}/api/merchandise`;

  constructor(private http: HttpClient) { }

  getAllMerchandise(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Merchandise>> {
    return this.http.get<PaginatedResponse<Merchandise>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  searchMerchandise(searchParams: MerchandiseSearch): Observable<PaginatedResponse<Merchandise>> {
    let params = new HttpParams()
      .set('page', searchParams.page.toString())
      .set('pageSize', searchParams.pageSize.toString());
      
    if (searchParams.keywords) {
      params = params.set('keywords', searchParams.keywords);
    }
    
    if (searchParams.minPrice !== undefined) {
      params = params.set('minPrice', searchParams.minPrice.toString());
    }
    
    if (searchParams.maxPrice !== undefined) {
      params = params.set('maxPrice', searchParams.maxPrice.toString());
    }
    
    if (searchParams.categoryId !== undefined) {
      params = params.set('categoryId', searchParams.categoryId.toString());
    }
    
    if (searchParams.sortBy !== undefined) {
      params = params.set('sortBy', searchParams.sortBy.toString());
    }
    
    return this.http.get<PaginatedResponse<Merchandise>>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of<PaginatedResponse<Merchandise>>({
              items: [],
              totalCount: 0,
              pageNumber: searchParams.page,
              pageSize: searchParams.pageSize,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false
            });
          }

          throw error;
        })
      );
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

  deleteImage(merchandiseId: number, imageUrl: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/image/${merchandiseId}/${imageUrl}`
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
          return [];
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
