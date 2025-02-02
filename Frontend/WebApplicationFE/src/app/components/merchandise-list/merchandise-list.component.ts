import { Component, OnInit } from '@angular/core';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';
import { Router } from '@angular/router'; // Import the Router

@Component({
  selector: 'app-merchandise-list',
  templateUrl: './merchandise-list.component.html',
  styleUrls: ['./merchandise-list.component.css']
})
export class MerchandiseListComponent implements OnInit {
  merchandiseList: Merchandise[] = [];
  isLoading = true;
  errorMessage: string | undefined;

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
    this.merchandiseService.getAllMerchandise().subscribe({
      next: (data) => {
        console.log('Merchandise data received', data);
        this.merchandiseList = data;
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

  goToDetails(merchId: number): void {
    this.router.navigate(['/merchandise', merchId]);
  }
}