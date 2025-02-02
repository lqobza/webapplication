import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Merchandise } from '../../models/merchandise.model';
import { MerchandiseService } from '../../services/merchandise.service';

@Component({
  selector: 'app-merchandise-detail',
  templateUrl: './merchandise-detail.component.html', // Make sure the template is correct
  styleUrls: ['./merchandise-detail.component.css']
})
export class MerchandiseDetailComponent implements OnInit {
  merchandise: Merchandise | undefined;
  isLoading = true;
  errorMessage: string | undefined;

  constructor(
    private route: ActivatedRoute,
    private merchandiseService: MerchandiseService
  ) { }

  ngOnInit(): void {
    console.log('MerchandiseDetailComponent initialized');
    this.loadMerchandise();
  }

  loadMerchandise(): void {
    this.isLoading = true;
    this.route.paramMap.subscribe(params => {
      const merchId = Number(params.get('id'));
      if (isNaN(merchId)) {
        this.errorMessage = "Invalid Merchandise ID";
        this.isLoading = false;
        return;
      }

      this.merchandiseService.getMerchandiseById(merchId).subscribe({
        next: (data) => {
          console.log('Merchandise data received', data);
          this.merchandise = data;
          this.isLoading = false;
          this.errorMessage = undefined;
        },
        error: (error) => {
          console.error('Error fetching merchandise', error);
          this.errorMessage = error.message || "Error fetching merchandise";
          this.isLoading = false;
          this.merchandise = undefined; // clear any previous merchandise data on error
        }
      });
    });
  }
}