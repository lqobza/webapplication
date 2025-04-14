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
    it('should send a POST request with the correct rating data', () => {
      // Create test rating data
      const testRating: RatingDto = {
        merchId: 1,
        rating: 4.5,
        description: 'Great product!'
      };

      // Expected response
      const mockResponse = {
        id: 123,
        ...testRating,
        createdAt: new Date().toISOString()
      };

      // Call the service method
      service.insertRating(testRating).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Check the request was made correctly
      const req = httpMock.expectOne(`${environment.apiUrl}/api/rating`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testRating);
      
      // Mock the response
      req.flush(mockResponse);
    });

    it('should handle errors when inserting a rating', () => {
      // Create test rating data with invalid properties
      const invalidRating: RatingDto = {
        merchId: -1, // Invalid ID
        rating: 6, // Rating out of range
        description: ''  // Empty description
      };

      // Expected error response
      const errorResponse = {
        status: 400,
        statusText: 'Bad Request'
      };

      // Call the service method
      let errorResult: any;
      service.insertRating(invalidRating).subscribe({
        next: () => fail('Expected an error, not success'),
        error: (error) => {
          errorResult = error;
        }
      });

      // Check the request
      const req = httpMock.expectOne(`${environment.apiUrl}/api/rating`);
      expect(req.request.method).toBe('POST');
      
      // Respond with mock error
      req.flush('Invalid rating data', errorResponse);
    });
  });
});
