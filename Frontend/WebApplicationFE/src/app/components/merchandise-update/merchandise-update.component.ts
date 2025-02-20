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
        this.merchandise = { ...data }; // Deep copy using spread syntax!
        this.originalMerchandise = { ...data }; // Deep copy using spread syntax!
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error fetching merchandise for update:", error);
        this.errorMessage = error.message || "Error fetching merchandise";
        this.isLoading = false;
      }
    });
  }

  updateMerchandise() {
    this.successMessage = undefined; // Clear any previous success messages
    this.errorMessage = undefined; // Clear any previous error messages

    if (!this.merchandise) return;

    this.isLoading = true; // Set loading to true before making the API call

    this.merchandiseService.updateMerchandise(this.merchandise.id!, this.merchandise).subscribe({
      next: () => {
        console.log("Merchandise updated successfully.");
        this.successMessage = "Merchandise updated successfully!"; // Set success message
        this.isLoading = false; // Set loading to false after successful update
        // Optionally, you can navigate back to the details page after a short delay:
        setTimeout(() => {
          this.router.navigate(['/merchandise', this.merchandise!.id]);
        }, 1500); // Delay of 1.5 seconds (adjust as needed)
      },
      error: (error) => {
        console.error("Error updating merchandise:", error);
        this.errorMessage = error.message || "Error updating merchandise";
        this.isLoading = false; // Set loading to false after error
      }
    });
  }

  onFormChange() {
    this.isFormDirty = this.hasChanges();
    console.log(this.isFormDirty);
  }

  hasChanges(): boolean {
    if (!this.originalMerchandise || !this.merchandise) return false;

    return (
      this.originalMerchandise.name !== this.merchandise.name ||
      this.originalMerchandise.price !== this.merchandise.price ||
      this.originalMerchandise.description !== this.merchandise.description ||
      this.originalMerchandise.brandName !== this.merchandise.brandName
      // Add other properties here as needed
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