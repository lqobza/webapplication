import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RatingDto } from '../models/rating.model';

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private apiUrl = 'http://localhost:5214/api/rating';

  constructor(private http: HttpClient) { }

  insertRating(rating: RatingDto): Observable<any> {
    return this.http.post(`${this.apiUrl}`, rating);
  }
}
