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
      name: 'T-Shirt 1',
      description: 'Test description',
      price: 25.99,
      categoryId: 1,
      categoryName: 'T-Shirts',
      sizes: ['S', 'M', 'L'],
      images: [mockImages[0]]
    },
    {
      id: 2,
      name: 'Hoodie 1',
      description: 'Warm hoodie',
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

    // Set up default mock returns
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

  it('should load merchandise on init', () => {
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalled();
    expect(component.merchandiseList).toEqual(mockMerchandiseItems);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle search term changes', () => {
    // Test the search functionality
    component.searchTerm = 'shirt';
    component.onSearch();
    
    // Need to call search manually since we're not waiting for the debounce
    component.searchMerchandise();
    
    // Verify searchMerchandise was called with correct parameters
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        keywords: 'shirt',
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should apply category filter', () => {
    // Select a category
    component.selectedCategoryId = 1;
    component.applyFilters();
    
    // Verify searchMerchandise was called with correct parameters
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        categoryId: 1,
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should apply price range filter', () => {
    // Set price range
    component.priceRange = { min: 20, max: 50 };
    component.applyFilters();
    
    // Verify searchMerchandise was called with correct parameters
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        minPrice: 20,
        maxPrice: 50,
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should apply sorting', () => {
    // Set sort option
    component.sortOption = 'price-low-high';
    component.applyFilters();
    
    // Verify searchMerchandise was called with correct parameters
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        sortBy: SortOption.PriceAsc,
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should reset filters', () => {
    // Set some filters
    component.searchTerm = 'shirt';
    component.selectedCategoryId = 1;
    component.priceRange = { min: 20, max: 50 };
    component.sortOption = 'price-low-high';
    
    // Reset filters
    component.resetFilters();
    
    // Verify filters are reset
    expect(component.searchTerm).toBe('');
    expect(component.selectedCategoryId).toBeUndefined();
    expect(component.priceRange.min).toBeUndefined();
    expect(component.priceRange.max).toBeUndefined();
    expect(component.sortOption).toBe('');
    
    // Verify search was called with reset params
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 1,
        pageSize: 6
      })
    );
  });

  it('should change page', () => {
    // Reset the spy tracking
    merchandiseServiceMock.searchMerchandise.calls.reset();
    
    // Call changePage
    component.changePage(2);
    
    // Verify the current page was updated
    expect(component.currentPage).toBe(2);
    
    // Verify searchMerchandise was called with the new page
    expect(merchandiseServiceMock.searchMerchandise).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 2,
        pageSize: 6
      })
    );
  });

  it('should navigate to details page', () => {
    // Call goToDetails
    component.goToDetails(1);
    
    // Verify router navigation
    expect(routerMock.navigate).toHaveBeenCalledWith(['/merchandise', 1]);
  });

  it('should handle API errors', () => {
    // Mock error response
    const errorMessage = 'Server error';
    merchandiseServiceMock.searchMerchandise.and.returnValue(
      throwError(() => new Error(errorMessage))
    );
    
    // Trigger search
    component.searchMerchandise();
    
    // Verify error handling
    expect(component.errorMessage).toBe(errorMessage);
    expect(component.isLoading).toBeFalse();
    expect(component.merchandiseList).toEqual([]);
  });

  it('should get correct image URL', () => {
    // Create merchandise items with proper typing for testing image URLs
    const relativeImage: MerchandiseImage = { 
      id: 1, 
      merchId: 1, 
      imageUrl: '/images/test.jpg', 
      isPrimary: true 
    };
    
    const absoluteImage: MerchandiseImage = { 
      id: 2, 
      merchId: 1, 
      imageUrl: 'https://example.com/test.jpg', 
      isPrimary: true 
    };

    // Test with relative URL
    const relativeItem: Merchandise = {
      ...mockMerchandiseItems[0],
      images: [relativeImage]
    };
    
    const absoluteUrl = component.getImageUrl(relativeItem);
    expect(absoluteUrl).toBe(`${environment.apiUrl}/images/test.jpg`);
    
    // Test with absolute URL
    const absoluteItem: Merchandise = {
      ...mockMerchandiseItems[0],
      images: [absoluteImage]
    };
    
    const unchangedUrl = component.getImageUrl(absoluteItem);
    expect(unchangedUrl).toBe('https://example.com/test.jpg');
    
    // Test with no images
    const noImageItem: Merchandise = {
      ...mockMerchandiseItems[0],
      images: []
    };
    
    const placeholderUrl = component.getImageUrl(noImageItem);
    expect(placeholderUrl).toBe('assets/images/placeholder.png');
  });
}); 