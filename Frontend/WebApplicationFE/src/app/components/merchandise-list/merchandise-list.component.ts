import { Component, OnInit } from '@angular/core';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';
import { Router } from '@angular/router';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { MerchandiseSearch, SortOption } from '../../models/merchandise-search.model';
import { Category } from '../../models/category.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-merchandise-list',
  templateUrl: './merchandise-list.component.html',
  styleUrls: ['./merchandise-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MerchandiseListComponent implements OnInit {
  merchandiseList: Merchandise[] = [];
  isLoading = true;
  errorMessage: string | undefined;
  currentPage = 1;
  pageSize = 6;
  paginationInfo: PaginatedResponse<Merchandise> = {
    items: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 6,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  };
  
  categories: Category[] = [];
  selectedCategoryId: number | undefined;
  priceRange: { min: number | undefined, max: number | undefined } = { min: undefined, max: undefined };
  sortOption: string = '';
  searchTerm: string = '';
  private searchTerms = new Subject<string>();
  
  constructor(
    private merchandiseService: MerchandiseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.searchMerchandise();
    });
    
    this.searchMerchandise();
  }
  
  loadCategories(): void {
    this.merchandiseService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        //console.error('Error fetching categories', error);
      }
    });
  }

  searchMerchandise(): void {
    this.isLoading = true;
    
    const searchParams: MerchandiseSearch = {
      page: this.currentPage,
      pageSize: this.pageSize
    };
    
    if (this.searchTerm) {
      searchParams.keywords = this.searchTerm;
    }
    
    if (this.selectedCategoryId) {
      searchParams.categoryId = this.selectedCategoryId;
    }
    
    if (this.priceRange.min !== undefined) {
      searchParams.minPrice = this.priceRange.min;
    }
    
    if (this.priceRange.max !== undefined) {
      searchParams.maxPrice = this.priceRange.max;
    }
    
    switch (this.sortOption) {
      case 'price-low-high':
        searchParams.sortBy = SortOption.PriceAsc;
        break;
      case 'price-high-low':
        searchParams.sortBy = SortOption.PriceDesc;
        break;
      case 'name-a-z':
        searchParams.sortBy = SortOption.NameAsc;
        break;
      case 'name-z-a':
        searchParams.sortBy = SortOption.NameDesc;
        break;
    }
    
    this.merchandiseService.searchMerchandise(searchParams).subscribe({
      next: (response) => {
        this.merchandiseList = response.items;
        this.paginationInfo = response;
        this.isLoading = false;
        this.errorMessage = undefined;
        
        if (this.merchandiseList.length === 0 && this.paginationInfo.totalPages > 0 && this.currentPage > this.paginationInfo.totalPages) {
          this.currentPage = this.paginationInfo.totalPages;
          this.searchMerchandise();
        }
      },
      error: (error) => {
        //console.error('Error searching merchandise', error);
        this.errorMessage = error.message || "Error searching merchandise";
        this.isLoading = false;
        this.merchandiseList = [];
      }
    });
  }

  onSearch(): void {
    this.searchTerms.next(this.searchTerm);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.searchMerchandise();
  }

  resetFilters(): void {
    this.selectedCategoryId = undefined;
    this.priceRange = { min: undefined, max: undefined };
    this.sortOption = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.searchMerchandise();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && (!this.paginationInfo || newPage <= this.paginationInfo.totalPages)) {
      this.currentPage = newPage;
      this.searchMerchandise();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToDetails(merchId: number): void {
    this.router.navigate(['/merchandise', merchId]);
  }

  getImageUrl(merchandise: Merchandise): string {
    if (merchandise.images && merchandise.images.length > 0) {
      const primaryImage = merchandise.images.find(img => img.isPrimary);
      const imageUrl = primaryImage ? primaryImage.imageUrl : merchandise.images[0].imageUrl;
      
      if (imageUrl && imageUrl.startsWith('/')) {
        return `${environment.apiUrl}${imageUrl}`;
      }
      return imageUrl;
    }
    
    return 'assets/images/placeholder.png';
  }
}