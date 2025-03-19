import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Merchandise } from '../../models/merchandise.model';
import { MerchandiseService } from '../../services/merchandise.service';
import { RatingService } from '../../services/rating.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MerchandiseImage } from '../../models/merchandise-image.model';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-merchandise-detail',
  templateUrl: './merchandise-detail.component.html',
  styleUrls: ['./merchandise-detail.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MerchandiseDetailComponent implements OnInit {
  merchandise: Merchandise | undefined;
  isLoading = false;
  errorMessage: string | null = null;
  selectedSize: string | undefined;
  inStock: number | undefined;
  quantity: number = 1;
  hasMultipleSizes: boolean = false;
  isAddToCartDisabled: boolean = false;
  newRatingText: string = '';
  newRating: number = 0;
  selectedImage: MerchandiseImage | null = null;

  constructor(
    private route: ActivatedRoute,
    private merchandiseService: MerchandiseService,
    private ratingService: RatingService,
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMerchandise(+id);
      }
    });
  }

  loadMerchandise(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.merchandiseService.getMerchandiseById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.merchandise = data;

          if (this.merchandise && this.merchandise.sizes) {
            const validSizes = this.merchandise.sizes.filter(s => s.size !== null);
            this.hasMultipleSizes = validSizes.length > 1;

            if (validSizes.length > 0) {
              this.selectedSize = validSizes[0].size;
              this.inStock = this.getInStock(this.selectedSize);
            } else {
              this.selectedSize = undefined;
              this.inStock = this.merchandise.sizes[0]?.inStock;
            }

            this.quantity = 1;
          } else {
            this.selectedSize = undefined;
            this.inStock = undefined;
          }

          this.loadMerchandiseImages();
        },
        error: (err) => {
          this.errorMessage = err.message || "Error fetching merchandise";
          this.isLoading = false;
          this.merchandise = undefined;
          this.selectedSize = undefined;
          this.inStock = undefined;
        }
      });
  }
  
  onSizeChange(): void {
    this.inStock = this.getInStock(this.selectedSize);
    this.quantity = 1;
  }

  getInStock(size: string | undefined): number | undefined {
    return this.merchandise && size ? this.merchandise.sizes?.find(s => s.size === size)?.inStock : undefined;
  }

  get isAddToCartEnabled(): boolean {
    if (!this.merchandise) return false;

    if (this.hasMultipleSizes) {
      return !!this.selectedSize && !!this.merchandise.sizes?.find(s => s.size === this.selectedSize)?.inStock;
    }

    if (this.merchandise.sizes?.length === 1) {
      return this.merchandise.sizes[0]?.inStock > 0;
    }

    return false;
  }

  isOutOfStock(): boolean {
    const inStock = this.getInStock(this.selectedSize);
    return !!this.selectedSize && inStock !== undefined && inStock <= 0;
  }

  onQuantityChange(): void {
    if (this.quantity < 1) {
      this.quantity = 1;
    }

    if (this.quantity > this.maxQuantity) {
      this.isAddToCartDisabled = true;
    } else {
      this.isAddToCartDisabled = false;
    }
  }

  get maxQuantity(): number {
    if (this.hasMultipleSizes) {
      const inStock = this.getInStock(this.selectedSize);
      return inStock && inStock > 0 ? inStock : 1;
    }

    if (this.merchandise?.sizes?.length === 1) {
      return this.merchandise.sizes[0]?.inStock > 0 ? this.merchandise.sizes[0].inStock : 1;
    }

    return 1;
  }
  
  addToCart(): void {
    if (!this.merchandise) {
      return;
    }
    
    if (!this.selectedSize) {
      this.snackBar.open('Please select a size', 'Close', { duration: 3000 });
      return;
    }
    
    const stock = this.getInStock(this.selectedSize);
    if (stock && stock < this.quantity) {
      this.snackBar.open(`Sorry, only ${stock} items available in this size`, 'Close', { duration: 3000 });
      return;
    }
    
    const cartItem = {
      id: this.merchandise.id,
      merchId: this.merchandise.id,
      name: this.merchandise.name,
      size: this.selectedSize,
      quantity: this.quantity,
      price: this.merchandise.price,
      imageUrl: this.selectedImage?.imageUrl
    };
    
    try {
      this.cartService.addToCart(cartItem);
      
      this.snackBar.open('Added to cart!', 'View Cart', {
        duration: 3000
      }).onAction().subscribe(() => {
        this.router.navigate(['/cart']);
      });
    } catch (error) {
      this.snackBar.open('Failed to add item to cart', 'Close', { duration: 3000 });
    }
  }

  setNewRating(rating: number) {
    this.newRating = rating;
  }
  
  addRating() {
    if (!this.merchandise?.id || !this.newRatingText.trim() || this.newRating <= 0) return;
  
    const newRating = {
      rating: this.newRating,
      description: this.newRatingText.trim(),
      merchId: this.merchandise.id
    };
  
    this.merchandise.ratings = this.merchandise.ratings || [];
    this.merchandise.ratings.push(newRating);
  
    this.ratingService.insertRating(newRating).subscribe({
      next: () => {
        this.refreshRatings();
        this.newRatingText = '';
        this.newRating = 0;
      },
      error: (error) => console.error("Error adding rating:", error)
    });
  }

  refreshRatings() {
    if (!this.merchandise?.id) return;
    this.merchandiseService.getMerchandiseById(this.merchandise.id).subscribe({
      next: (data) => this.merchandise!.ratings = data.ratings,
      error: (error) => console.error("Error refreshing ratings:", error)
    });
  }

  loadMerchandiseImages() {
    if (this.merchandise && this.merchandise.id) {
      this.merchandiseService.getMerchandiseImages(this.merchandise.id)
        .subscribe({
          next: (images) => {
            if (this.merchandise) {
              this.merchandise.images = images;
              this.selectedImage = null;
            }
          },
          error: (error) => {
            console.error('Error loading merchandise images:', error);
          }
        });
    }
  }

  getPrimaryImageUrl(): string {
    if (!this.merchandise?.images || this.merchandise.images.length === 0) {
      return 'assets/images/placeholder.png';
    }
    
    if (this.selectedImage) {
      return this.getFullImageUrl(this.selectedImage.imageUrl);
    }
    
    const primaryImage = this.merchandise.images.find(img => img.isPrimary);
    return this.getFullImageUrl(primaryImage ? primaryImage.imageUrl : this.merchandise.images[0].imageUrl);
  }

  selectImage(image: MerchandiseImage): void {
    this.selectedImage = image;
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  getStockForSize(size: string): number {
    if (!this.merchandise || !this.merchandise.sizes) {
      return 0;
    }
    
    const sizeObj = this.merchandise.sizes.find(s => s.size === size);
    const stock = sizeObj ? sizeObj.inStock : 0;
    return stock;
  }

  incrementQuantity(): void {
    const stock = this.getInStock(this.selectedSize);
    if (stock && this.quantity < stock) {
      this.quantity++;
    } else {
      this.snackBar.open(`Sorry, only ${stock} items available in this size`, 'Close', { duration: 3000 });
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  getFullImageUrl(relativeUrl: string): string {
    if (relativeUrl && relativeUrl.startsWith('/')) {
      return `${environment.apiUrl}${relativeUrl}`;
    }
    return relativeUrl;
  }
}