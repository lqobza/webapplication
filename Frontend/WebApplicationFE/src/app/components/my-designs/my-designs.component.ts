import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

interface CustomDesign {
  id: number;
  userId: string;
  name: string;
  frontImage: string;
  backImage: string;
  createdAt: Date;
  selectedSize?: string;
  selectedQuantity?: number;
}

interface CustomProduct {
  id: string;
  name: string;
  frontImage: string;
  backImage: string;
  tshirtColor: string;
  size: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
}

@Component({
  selector: 'app-my-designs',
  templateUrl: './my-designs.component.html',
  styleUrls: ['./my-designs.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ]
})
export class MyDesignsComponent implements OnInit {
  designs: CustomDesign[] = [];
  loading = true;
  error: string | null = null;
  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDesigns();
  }

  loadDesigns(): void {
    if (!this.authService.isLoggedIn()) {
      this.error = 'You must be logged in to view your designs';
      this.loading = false;
      return;
    }

    const userId = this.authService.getCurrentUserId();
    this.http.get<CustomDesign[]>(`${environment.apiUrl}/api/customdesign/user/${userId}`)
      .subscribe({
        next: (designs) => {
          this.designs = designs.map(design => ({
            ...design,
            selectedSize: 'M',
            selectedQuantity: 1
          }));
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading designs:', error);
          this.error = 'Failed to load your designs. Please try again.';
          this.loading = false;
        }
      });
  }

  addToCart(design: CustomDesign): void {
    // Ensure we have valid values
    if (!design.selectedSize) {
      design.selectedSize = 'M';
    }
    
    if (!design.selectedQuantity || design.selectedQuantity < 1) {
      design.selectedQuantity = 1;
    }
    
    // Truncate the image data for storage if it's too large
    // This is just for logging, the actual image will be handled by the cart service
    const truncatedFrontImage = design.frontImage ? 
      (design.frontImage.length > 100 ? design.frontImage.substring(0, 100) + '...' : design.frontImage) : null;
    
    const customProduct: CustomProduct = {
      id: 'custom-' + design.id,
      name: design.name,
      frontImage: design.frontImage,
      backImage: design.backImage,
      tshirtColor: '#ffffff', // Default color
      size: design.selectedSize,
      price: 30,
      quantity: design.selectedQuantity,
      isCustom: true
    };
    
    this.cartService.addToCart(customProduct);
    this.snackBar.open(`Added ${design.selectedQuantity} ${design.name} (Size: ${design.selectedSize}) to cart!`, 'Close', { duration: 3000 });
  }

  deleteDesign(id: number): void {
    if (confirm('Are you sure you want to delete this design?')) {
      this.http.delete(`${environment.apiUrl}/api/customdesign/${id}`)
        .subscribe({
          next: () => {
            this.designs = this.designs.filter(d => d.id !== id);
            this.snackBar.open('Design deleted successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting design:', error);
            this.snackBar.open('Failed to delete design', 'Close', { duration: 3000 });
          }
        });
    }
  }

  createNewDesign(): void {
    this.router.navigate(['/custom-design']);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
} 