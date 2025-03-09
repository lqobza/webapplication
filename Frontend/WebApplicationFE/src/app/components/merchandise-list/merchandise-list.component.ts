import { Component, OnInit } from '@angular/core';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';
import { Router } from '@angular/router';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-merchandise-list',
  templateUrl: './merchandise-list.component.html',
  styleUrls: ['./merchandise-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MerchandiseListComponent implements OnInit {
  merchandiseList: Merchandise[] = [];
  filteredList: Merchandise[] = [];
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
  
  // Filtering and sorting properties
  categories: string[] = [];
  selectedCategory: string = '';
  priceRange: { min: number, max: number } = { min: 0, max: 1000 };
  sortOption: string = '';
  searchTerm: string = '';

  constructor(
    private merchandiseService: MerchandiseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('MerchandiseListComponent initialized');
    this.loadMerchandise();
  }

  loadMerchandise(): void {
    this.isLoading = true;
    this.merchandiseService.getAllMerchandise(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        console.log('Merchandise data received', response);
        this.merchandiseList = response.items;
        this.filteredList = [...this.merchandiseList];
        this.paginationInfo = response;
        this.isLoading = false;
        this.errorMessage = undefined;
        
        // Extract unique categories
        this.extractCategories();
      },
      error: (error) => {
        console.error('Error fetching merchandise', error);
        this.errorMessage = error.message || "Error fetching merchandise";
        this.isLoading = false;
      }
    });
  }

  extractCategories(): void {
    const uniqueCategories = new Set<string>();
    this.merchandiseList.forEach(item => {
      if (item.categoryName) {
        uniqueCategories.add(item.categoryName);
      }
    });
    this.categories = Array.from(uniqueCategories);
  }

  applyFilters(): void {
    this.filteredList = this.merchandiseList.filter(item => {
      // Category filter
      if (this.selectedCategory && item.categoryName !== this.selectedCategory) {
        return false;
      }
      
      // Price range filter
      if (item.price < this.priceRange.min || item.price > this.priceRange.max) {
        return false;
      }
      
      return true;
    });
    
    this.applySorting();
  }

  applySearch(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredList = this.merchandiseList.filter(item => 
      item.name.toLowerCase().includes(searchTermLower) || 
      item.description.toLowerCase().includes(searchTermLower)
    );
    
    this.applySorting();
  }

  applySorting(): void {
    switch (this.sortOption) {
      case 'price-low-high':
        this.filteredList.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        this.filteredList.sort((a, b) => b.price - a.price);
        break;
      case 'name-a-z':
        this.filteredList.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-z-a':
        this.filteredList.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // No sorting
        break;
    }
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.priceRange = { min: 0, max: 1000 };
    this.sortOption = '';
    this.searchTerm = '';
    this.filteredList = [...this.merchandiseList];
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && (!this.paginationInfo || newPage <= this.paginationInfo.totalPages)) {
      this.currentPage = newPage;
      this.loadMerchandise();
      // Scroll to top of the list
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