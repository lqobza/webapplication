import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Merchandise } from '../../models/merchandise.model';
import { MerchandiseService } from '../../services/merchandise.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-merchandise-update',
  templateUrl: './merchandise-update.component.html',
  styleUrls: ['./merchandise-update.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MerchandiseUpdateComponent implements OnInit {
  merchandise: Merchandise | undefined;
  originalMerchandise: Merchandise | undefined;
  isLoading = true;
  errorMessage: string | undefined;
  successMessage: string | undefined;
  isFormDirty = false;

  constructor(
    private route: ActivatedRoute,
    private merchandiseService: MerchandiseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const merchId = Number(params.get('id'));
      if (isNaN(merchId)) {
        this.errorMessage = "Invalid Merchandise ID";
        this.isLoading = false;
        return;
      }

      this.loadMerchandise(merchId);
    });
  }

  loadMerchandise(merchId: number): void {
    this.isLoading = true;
    this.merchandiseService.getMerchandiseById(merchId).subscribe({
      next: (data) => {
        this.merchandise = { ...data };
        this.originalMerchandise = { ...data };
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || "Error fetching merchandise";
        this.isLoading = false;
      }
    });
  }

  updateMerchandise() {
    this.successMessage = undefined;
    this.errorMessage = undefined;

    if (!this.merchandise) return;

    this.isLoading = true;

    this.merchandiseService.updateMerchandise(this.merchandise.id!, this.merchandise).subscribe({
      next: () => {
        this.successMessage = "Merchandise updated successfully!";
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/merchandise', this.merchandise!.id]);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.message || "Error updating merchandise";
        this.isLoading = false;
      }
    });
  }

  onFormChange() {
    this.isFormDirty = this.hasChanges();
  }

  hasChanges(): boolean {
    if (!this.originalMerchandise || !this.merchandise) return false;

    return (
      this.originalMerchandise.name !== this.merchandise.name ||
      this.originalMerchandise.price !== this.merchandise.price ||
      this.originalMerchandise.description !== this.merchandise.description ||
      this.originalMerchandise.brandName !== this.merchandise.brandName
    );
  }

  cancelUpdate() {
    if (this.merchandise && this.merchandise.id) {
      this.router.navigate(['/merchandise', this.merchandise.id]);
    } else {
      this.router.navigate(['/merchandise']);
    }
  }
}