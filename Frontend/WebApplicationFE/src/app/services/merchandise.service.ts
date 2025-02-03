import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Merchandise } from '../models/merchandise.model';
import { Category } from '../models/category.model';
import { Brand } from '../models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class MerchandiseService {
  private apiUrl = 'http://localhost:5214/api/merchandise';

  constructor(private http: HttpClient) { }

  getAllMerchandise(): Observable<Merchandise[]> {
    console.log('Fetching all merchandise');
    return this.http.get<Merchandise[]>(`${this.apiUrl}`);
  }

  insertMerchandise(merchandise: Merchandise): Observable<any> {
    return this.http.post(`${this.apiUrl}`, merchandise);
  }

  getMerchandiseById(merchId: number): Observable<Merchandise> {
    console.log('Fetching merchandise: ' + merchId);
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
    return this.http.get<any[]>(`${this.apiUrl}/sizes/${categoryId}`);
  }

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/brands`);
  }
}
