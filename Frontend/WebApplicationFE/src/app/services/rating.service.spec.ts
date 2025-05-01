import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RatingService } from './rating.service';
import { RatingDto } from '../models/rating.model';
import { environment } from 'src/environments/environment';

describe('RatingService', () => {
  let service: RatingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RatingService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(RatingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('insertRating', () => {
    it('should send a POST request with the rating data', () => {
      const testRating: RatingDto = {
        merchId: 1,
        rating: 4.5,
        description: 'great product'
      };

      const mockResponse = {
        id: 123,
        ...testRating,
        createdAt: new Date().toISOString()
      };

      service.insertRating(testRating).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/api/rating`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(testRating);
      request.flush(mockResponse);
    });

    it('should handle error when inserting a rating', () => {
      const invalidRating: RatingDto = {
        merchId: -1,
        rating: 6,
        description: ''
      };

      const errorResponse = {
        status: 400,
        statusText: 'Bad Request'
      };

      let errorResult: any;
      service.insertRating(invalidRating).subscribe({
        next: () => fail('Expected an error, not success'),
        error: (error) => {
          errorResult = error;
        }
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/api/rating`);
      expect(request.request.method).toBe('POST');
      request.flush('Invalid rating data', errorResponse);
    });
  });
});
