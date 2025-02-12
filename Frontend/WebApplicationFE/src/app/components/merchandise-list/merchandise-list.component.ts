import { Component, OnInit } from '@angular/core';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';
import { Router } from '@angular/router';
import { PaginatedResponse } from '../../models/paginated-response.model';

@Component({
  selector: 'app-merchandise-list',
  templateUrl: './merchandise-list.component.html',
  styleUrls: ['./merchandise-list.component.css']
})
export class MerchandiseListComponent implements OnInit {
  merchandiseList: Merchandise[] = [];
  isLoading = true;
  errorMessage: string | undefined;
  currentPage = 1;
  pageSize = 6;
  paginationInfo: PaginatedResponse<Merchandise> | null = null;

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
        this.paginationInfo = response;
        this.isLoading = false;
        this.errorMessage = undefined;
      },
      error: (error) => {
        console.error('Error fetching merchandise', error);
        this.errorMessage = error.message || "Error fetching merchandise";
        this.isLoading = false;
      }
    });
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
}