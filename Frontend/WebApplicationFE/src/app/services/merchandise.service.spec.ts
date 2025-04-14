import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MerchandiseService } from './merchandise.service';
import { ErrorHandlingService } from './error-handling.service';
import { Merchandise } from '../models/merchandise.model';
import { Category } from '../models/category.model';
import { environment } from 'src/environments/environment';
import { MerchandiseSearch, SortOption } from '../models/merchandise-search.model';

describe('MerchandiseService', () => {
  let service: MerchandiseService;
  let httpMock: HttpTestingController;
  let errorHandlingServiceMock: jasmine.SpyObj<ErrorHandlingService>;

  beforeEach(() => {
    // Create mock for ErrorHandlingService
    errorHandlingServiceMock = jasmine.createSpyObj('ErrorHandlingService', ['handleError']);
    
    TestBed.configureTestingModule({
      providers: [
        MerchandiseService,
        { provide: ErrorHandlingService, useValue: errorHandlingServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(MerchandiseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllMerchandise', () => {
    it('should return paginated merchandise list', () => {
      // Mock response data
      const mockResponse = {
        items: [
          { id: 1, name: 'T-Shirt', price: 25, categoryId: 1, description: 'A T-shirt', images: [] }
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };

      // Make the call
      service.getAllMerchandise().subscribe(data => {
        expect(data).toEqual(mockResponse);
        expect(data.items.length).toBe(1);
        expect(data.items[0].name).toBe('T-Shirt');
      });

      // Expect a GET request to the specified URL
      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise?page=1&pageSize=10`);
      expect(req.request.method).toBe('GET');
      
      // Resolve with mock data
      req.flush(mockResponse);
    });
  });

  describe('searchMerchandise', () => {
    it('should correctly build search parameters', () => {
      // Create search parameters
      const searchParams: MerchandiseSearch = {
        page: 1,
        pageSize: 10,
        keywords: 'shirt',
        minPrice: 20,
        maxPrice: 50,
        categoryId: 1,
        sortBy: SortOption.PriceAsc
      };

      // Mock response
      const mockResponse = {
        items: [
          { id: 1, name: 'Blue Shirt', price: 25, categoryId: 1, description: 'A blue shirt', images: [] }
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };

      // Make the call
      service.searchMerchandise(searchParams).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      // Check that the request URL and parameters are correct
      const req = httpMock.expectOne(request => request.url === `${environment.apiUrl}/api/merchandise/search`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('keywords')).toBe('shirt');
      expect(req.request.params.get('minPrice')).toBe('20');
      expect(req.request.params.get('maxPrice')).toBe('50');
      expect(req.request.params.get('categoryId')).toBe('1');
      
      req.flush(mockResponse);
    });
  });

  describe('getMerchandiseById', () => {
    it('should return a single merchandise item by id', () => {
      const mockMerch: Merchandise = { 
        id: 1, 
        name: 'T-Shirt', 
        price: 25, 
        categoryId: 1, 
        description: 'A T-shirt', 
        images: [] 
      };

      service.getMerchandiseById(1).subscribe(merch => {
        expect(merch).toEqual(mockMerch);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMerch);
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'T-Shirts' },
        { id: 2, name: 'Hoodies' }
      ];

      service.getCategories().subscribe(categories => {
        expect(categories).toEqual(mockCategories);
        expect(categories.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });
  });

  describe('createMerchandise', () => {
    it('should create merchandise and return the created item', () => {
      const newMerch = {
        name: 'New T-Shirt',
        price: 29.99,
        categoryId: 1,
        description: 'A brand new T-shirt',
        images: []
      };

      const mockResponse = { 
        id: 10,
        ...newMerch
      };

      service.createMerchandise(newMerch).subscribe(createdMerch => {
        expect(createdMerch).toEqual(mockResponse);
        expect(createdMerch.id).toBe(10);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newMerch);
      req.flush(mockResponse);
    });
  });

  describe('updateMerchandise', () => {
    it('should update merchandise details', () => {
      const id = 1;
      const updates = {
        name: 'Updated T-Shirt',
        price: 34.99
      };

      service.updateMerchandise(id, updates).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updates);
      req.flush({ success: true });
    });
  });

  describe('deleteMerchandise', () => {
    it('should delete merchandise by id', () => {
      const id = 1;

      service.deleteMerchandise(id).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('checkStockAvailability', () => {
    it('should check if merchandise is in stock', () => {
      const id = 1;
      const size = 'M';
      const quantity = 2;
      const mockResponse = { available: true, stock: 10 };

      service.checkStockAvailability(id, size, quantity).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1/stock/M?quantity=2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
