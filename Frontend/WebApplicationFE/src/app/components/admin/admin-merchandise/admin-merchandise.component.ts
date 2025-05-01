import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule} from '@angular/material/dialog';
import { Merchandise } from '../../../models/merchandise.model';
import { MerchandiseService } from '../../../services/merchandise.service';
import { Category } from '../../../models/category.model';
import { PaginatedResponse } from '../../../models/paginated-response.model';

@Component({
  selector: 'app-admin-merchandise',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule

  ],
  templateUrl: './admin-merchandise.component.html',
  styleUrls: ['./admin-merchandise.component.css']
})
export class AdminMerchandiseComponent implements OnInit, AfterViewInit {
  merchandiseList: Merchandise[] = [];
  error: string | null = null;
  displayedColumns: string[] = ['id', 'name', 'price', 'category', 'actions'];
  categories: Category[] = [];
  categoryMap: Map<number, string> = new Map();
    
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    private merchandiseService: MerchandiseService,
  ) {}

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchMerchandise(1, this.pageSize);
  }
  
  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        this.pageSize = event.pageSize;
        this.pageIndex = event.pageIndex;
        this.fetchMerchandise(this.pageIndex + 1, this.pageSize);
      });
    }
  }

  fetchCategories(): void {
    this.merchandiseService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        
        this.categoryMap = new Map(
          this.categories
            .filter(category => category.id !== undefined)
            .map(category => [category.id as number, category.name])
        );
      }
    });
  }

  fetchMerchandise(page: number = 1, pageSize: number = 10): void {
    this.error = null;
    
    this.merchandiseService.getAllMerchandise(page, pageSize).subscribe({
      next: (response: PaginatedResponse<Merchandise>) => {
        this.merchandiseList = response.items;
        this.totalItems = response.totalCount;
        
        if (this.paginator) {
          if (this.paginator.pageIndex !== page - 1) {
            this.paginator.pageIndex = page - 1;
          }
          if (this.paginator.pageSize !== pageSize) {
            this.paginator.pageSize = pageSize;
          }
          if (this.paginator.length !== response.totalCount) {
            this.paginator.length = response.totalCount;
          }

        }

      },
      error: () => {
        this.error = 'Failed to load merchandise data';
      }
    });
  }

  getCategoryName(categoryId: number | undefined): string {
    if (categoryId === undefined || categoryId === null)
      return 'Unknown';

    return this.categoryMap.get(categoryId) || 'Unknown';
  }

  deleteMerchandise(id: number): void {
    if (!confirm(`Are you sure you want to delete this merchandise? This action cannot be undone.`)) {
      return;
    }
    
    this.merchandiseService.deleteMerchandise(id).subscribe({
      next: () => {
        this.fetchMerchandise(this.pageIndex + 1, this.pageSize);
      },
      error: () => {
        alert('Failed to delete merchandise');
      }
    });
  }
  
  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.fetchMerchandise(this.pageIndex + 1, this.pageSize);
  }
}