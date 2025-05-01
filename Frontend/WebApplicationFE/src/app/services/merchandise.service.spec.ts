import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MerchandiseService } from './merchandise.service';
import { Merchandise } from '../models/merchandise.model';
import { Category } from '../models/category.model';
import { environment } from 'src/environments/environment';
import { MerchandiseSearch, SortOption } from '../models/merchandise-search.model';

describe('MerchandiseService', () => {
  let service: MerchandiseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MerchandiseService,
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
    it('should return paginated merh list', () => {
      const mockResponse = {
        items: [
          { id: 1, name: 'tshirt', price: 25, categoryId: 1, description: 'description', images: [] }
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };

      service.getAllMerchandise().subscribe(data =>{
        expect(data).toEqual(mockResponse);
        expect(data.items.length).toBe(1);
        expect(data.items[0].name).toBe('tshirt');
      });

      const request =httpMock.expectOne(`${environment.apiUrl}/api/merchandise?page=1&pageSize=10`);
      expect(request.request.method).toBe('GET');
      request.flush(mockResponse);
    });
  });

  describe('searchMerchandise', () => {
    it('should build search parameters', () => {
      const searchParams: MerchandiseSearch = {
        page: 1,
        pageSize: 10,
        keywords: 'shirt',
        minPrice: 20,
        maxPrice: 50,
        categoryId: 1,
        sortBy: SortOption.PriceAsc
      };

      const mockResponse={
        items: [
          { id: 1, name: 'blue Shirt', price: 25, categoryId: 1, description: 'a blue shirt', images: []}
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };
      

      service.searchMerchandise(searchParams).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const request = httpMock.expectOne(request => request.url ===`${environment.apiUrl}/api/merchandise/search`);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('keywords')).toBe('shirt');
      expect(request.request.params.get('minPrice')).toBe('20');
      expect(request.request.params.get('maxPrice')).toBe('50');
      expect(request.request.params.get('categoryId')).toBe('1');
      
      request.flush(mockResponse);
    });
  });

  describe('getMerchandiseById', () => {
    it('should return a single merchandise item by id', () => {
      const mockMerch: Merchandise = { 
        id: 1, 
        name: 'tshirt', 
        price: 25, 
        categoryId: 1, 
        description: 'a tshirt', 
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

      const request= httpMock.expectOne(`${environment.apiUrl}/api/merchandise/categories`);
      expect(request.request.method).toBe('GET');
      request.flush(mockCategories);
    });
  });

  describe('createMerchandise', () => {
    it('should create merchandise and return the created item', () => {
      const newMerch = {
        name: 'New T-Shirt',
        price: 30,
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

      const request = httpMock.expectOne(`${environment.apiUrl}/api/merchandise`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(newMerch);
      request.flush(mockResponse);
    });
  });

  describe('updateMerchandise', () => { 
    it('should update merchandise details', ()=> {
      const id = 1;
      const updates = {
        name: 'Updated T-Shirt',
        price: 35
      };

      service.updateMerchandise(id, updates).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual(updates);
      request.flush({ success: true});
    });
  });

  describe('deleteMerchandise', () => {
    it('should delete merchandise by id', () => {
      const id=1;

      service.deleteMerchandise(id).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1`);
      expect(request.request.method).toBe('DELETE');
      request.flush({ success: true });
    });
  });

  describe('checkStockAvailability', () => {
    it('should check if merch is in stock', () => {
      const id = 1;
      const size = 'M';
      const quantity = 2; 
      const mockResponse = { available: true, stock: 10};

      service.checkStockAvailability(id, size, quantity).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });


      const request = httpMock.expectOne(`${environment.apiUrl}/api/merchandise/1/stock/M?quantity=2`);
      expect(request.request.method).toBe('GET');
      request.flush(mockResponse);
    });
  });
});
 