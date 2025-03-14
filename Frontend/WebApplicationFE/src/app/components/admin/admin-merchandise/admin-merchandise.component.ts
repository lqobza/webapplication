import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Merchandise } from '../../../models/merchandise.model';
import { MerchandiseService } from '../../../services/merchandise.service';
import { Category } from '../../../models/category.model';
import { forkJoin } from 'rxjs';

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
export class AdminMerchandiseComponent implements OnInit {
  merchandiseList: Merchandise[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['id', 'name', 'price', 'category', 'actions'];
  categories: Category[] = [];
  categoryMap: Map<number, string> = new Map();
  
  constructor(
    private merchandiseService: MerchandiseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchMerchandise();
  }

  fetchMerchandise(): void {
    this.loading = true;
    
    // Fetch both merchandise and categories in parallel
    forkJoin({
      merchandise: this.merchandiseService.getAllMerchandise(),
      categories: this.merchandiseService.getCategories()
    }).subscribe({
      next: (results) => {
        // Process categories
        this.categories = results.categories;
        console.log('Fetched categories:', this.categories);
        
        // Create a map of category IDs to names for quick lookup
        // Filter out categories with undefined IDs
        this.categoryMap = new Map(
          this.categories
            .filter(category => category.id !== undefined)
            .map(category => [category.id as number, category.name])
        );
        console.log('Category map:', Object.fromEntries(this.categoryMap));
        
        // Process merchandise
        this.merchandiseList = Array.isArray(results.merchandise) 
          ? results.merchandise 
          : results.merchandise.items || [];
        
        console.log('Fetched merchandise list:', this.merchandiseList);
        
        // Log each item's category information
        this.merchandiseList.forEach(item => {
          console.log(`Merchandise ID ${item.id}: categoryId=${item.categoryId}, mapped category name=${this.getCategoryName(item.categoryId)}`);
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching data:', err);
        this.error = 'Failed to load data. Please try again later.';
        this.loading = false;
      }
    });
  }

  getCategoryName(categoryId: number | undefined): string {
    if (categoryId === undefined || categoryId === null) {
      return 'Unknown';
    }
    return this.categoryMap.get(categoryId) || 'Unknown';
  }

  deleteMerchandise(id: number): void {
    if (!confirm(`Are you sure you want to delete this merchandise? This action cannot be undone.`)) {
      return;
    }
    
    this.merchandiseService.deleteMerchandise(id).subscribe({
      next: () => {
        this.merchandiseList = this.merchandiseList.filter(m => m.id !== id);
      },
      error: (err: any) => {
        console.error('Error deleting merchandise:', err);
        alert('Failed to delete merchandise. Please try again later.');
      }
    });
  }
}