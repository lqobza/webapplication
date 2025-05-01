import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RatingDto } from '../models/rating.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private apiUrl = `${environment.apiUrl}/api/rating`;

  constructor(private http: HttpClient) { }

  insertRating(rating: RatingDto): Observable<any> {
    return this.http.post(`${this.apiUrl}`,rating);
  }
}
