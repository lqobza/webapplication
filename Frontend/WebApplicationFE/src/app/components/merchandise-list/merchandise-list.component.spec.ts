import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MerchandiseListComponent } from './merchandise-list.component';
import { MerchandiseService } from '../../services/merchandise.service';
import { SortOption } from '../../models/merchandise-search.model';
import { environment } from 'src/environments/environment';
import { Merchandise } from '../../models/merchandise.model';
import { MerchandiseImage } from '../../models/merchandise-image.model';
import { PaginatedResponse } from '../../models/paginated-response.model';

describe('MerchandiseListComponent', () => {
  let component: MerchandiseListComponent;
  let fixture: ComponentFixture<MerchandiseListComponent>;
  let merchandiseServiceMock: jasmine.SpyObj<MerchandiseService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockCategories = [
    { id: 1, name: 'T-Shirts' },
    { id: 2, name: 'Hoodies' }
  ];

  // Create properly typed mock data
  const mockImages: MerchandiseImage[] = [
    { id: 1, merchId: 1, imageUrl: '/images/tshirt1.jpg', isPrimary: true },
    { id: 2, merchId: 2, imageUrl: '/images/hoodie1.jpg', isPrimary: true }
  ];

  const mockMerchandiseItems: Merchandise[] = [
    {
      id: 1,
      name: 't-shirt1',
      description: 'description',
      price: 25.99,
      categoryId: 1,
      categoryName: 'T-Shirts',
      sizes: ['S', 'M', 'L'],
      images: [mockImages[0]]
    },
    {
      id: 2,
      name: 'hoodie1',
      description: 'description hoodie',
      price: 45.99,
      categoryId: 2,
      categoryName: 'Hoodies',
      sizes: ['M', 'L', 'XL'],
      images: [mockImages[1]]
    }
  ];

  const mockPaginatedResponse: PaginatedResponse<Merchandise> = {
    items: mockMerchandiseItems,
    totalCount: 10,
    pageNumber: 1,
    pageSize: 6,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false
  };

  beforeEach(async () => {
    merchandiseServiceMock = jasmine.createSpyObj('MerchandiseService', ['getCategories', 'searchMerchandise']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    merchandiseServiceMock.getCategories.and.returnValue(of(mockCategories));
    merchandiseServiceMock.searchMerchandise.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: MerchandiseService, useValue: merchandiseServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MerchandiseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    expect(merchandiseServiceMock.getCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
  });

  it('should load merch on init', () => {

    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalled();
    expect(component.merchandiseList).toEqual(mockMerchandiseItems);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle search term changes', () => {
    component.searchTerm = 'shirt';
    component.onSearch();
    
    component.searchMerchandise(); 
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        keywords: 'shirt',
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should apply category filter', () => {
    component.selectedCategoryId = 1;
    component.applyFilters();
  
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        categoryId: 1,
        page: 1,
        pageSize: 6
      })
    ); 
  });


  it('should apply price filter', () => {
    component.priceRange = { min: 20, max: 30 };
    component.applyFilters();
    
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        minPrice: 20,
        maxPrice: 30,
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should apply sorting', () => {
    component.sortOption = 'price-low-high';
    component.applyFilters();
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        sortBy: SortOption.PriceAsc,
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should reset filters', () => {
    component.searchTerm = 'shirt';
    component.selectedCategoryId = 1;
    component.priceRange = { min: 20, max: 50 };
    component.sortOption = 'price-low-high';
    
    component.resetFilters();
    expect(component.searchTerm).toBe('');
    expect(component.selectedCategoryId).toBeUndefined();
    expect(component.priceRange.min).toBeUndefined();
    expect(component.priceRange.max).toBeUndefined();
    expect(component.sortOption).toBe('');
    
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 1,
        pageSize: 6
      }) 
    );
  });

  it ('should change page', () => { 
    merchandiseServiceMock.searchMerchandise.calls.reset();
    
    component.changePage(2);
    expect(component.currentPage).toBe(2);
    
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 2,
        pageSize: 6
      })
    );
  });


  it('should handle errors', () => {
    const errorMessage = 'Server error';
    merchandiseServiceMock.searchMerchandise.and.returnValue(
      throwError(() => new Error(errorMessage))
    );
    
    component.searchMerchandise();
    expect(component.errorMessage).toBe(errorMessage );
    expect(component.isLoading).toBeFalse();
    expect(component.merchandiseList).toEqual([]);

  });

  it('should get correct URL', () => {
    const relativeImage: MerchandiseImage = { 
      id: 1, 
      merchId: 1, 
      imageUrl: '/images/test.jpg', 
      isPrimary: true 
    };
    
    const absoluteImage: MerchandiseImage = { 
      id: 2, 
      merchId: 1, 
      imageUrl: 'http://example.com/test.jpg', 
      isPrimary: true 
    };

    const relativeItem: Merchandise = {
      ...mockMerchandiseItems[0],
      images: [relativeImage]
    };
    
    const absoluteUrl =component.getImageUrl(relativeItem);
    expect(absoluteUrl).toBe(`${environment.apiUrl}/images/test.jpg`);
    
    const absoluteItem: Merchandise = {
      ...mockMerchandiseItems[0],
      images: [absoluteImage]
    };
    
    const unchangedUrl = component.getImageUrl(absoluteItem);
    expect(unchangedUrl).toBe('http://example.com/test.jpg');
  
    const noImageItem: Merchandise = {
      ...mockMerchandiseItems[0],
      images: []
    };
    const placeholderUrl =component.getImageUrl(noImageItem);
    expect(placeholderUrl).toBe('assets/images/placeholder.png');
  });
}); 