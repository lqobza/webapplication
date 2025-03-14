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
    console.log('[MerchandiseDetail] Component initialized');
  }

  ngOnInit(): void {
    console.log('[MerchandiseDetail] ngOnInit called');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log(`[MerchandiseDetail] Route param 'id': ${id}`);
      if (id) {
        this.loadMerchandise(+id);
      } else {
        console.error('[MerchandiseDetail] No merchandise ID provided in route');
      }
    });
  }

  loadMerchandise(id: number): void {
    console.log(`[MerchandiseDetail] Loading merchandise with ID: ${id}`);
    this.isLoading = true;
    this.errorMessage = null;

    this.merchandiseService.getMerchandiseById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          console.log('[MerchandiseDetail] Merchandise loaded successfully:', data);
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
          console.error('Error fetching merchandise', err);
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

    // If multiple sizes exist, check selected size
    if (this.hasMultipleSizes) {
      return !!this.selectedSize && !!this.merchandise.sizes?.find(s => s.size === this.selectedSize)?.inStock;
    }

    // If only one size exists and size is null, check its stock
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

    // Check if quantity exceeds max and adjust or disable Add to Cart
    if (this.quantity > this.maxQuantity) {
      this.isAddToCartDisabled = true; // Add a property isAddToCartDisabled to the component
    } else {
      this.isAddToCartDisabled = false; // Re-enable if quantity is valid
    }
  }

  get maxQuantity(): number {
    if (this.hasMultipleSizes) {
      const inStock = this.getInStock(this.selectedSize);
      return inStock && inStock > 0 ? inStock : 1;
    }

    // If only one size exists and size is null, use its inStock value
    if (this.merchandise?.sizes?.length === 1) {
      return this.merchandise.sizes[0]?.inStock > 0 ? this.merchandise.sizes[0].inStock : 1;
    }

    return 1;
  }
  
  addToCart(): void {
    console.log('[MerchandiseDetail] Adding to cart');
    
    if (!this.merchandise) {
      console.error('[MerchandiseDetail] Cannot add to cart: No merchandise loaded');
      return;
    }
    
    if (!this.selectedSize) {
      console.error('[MerchandiseDetail] Cannot add to cart: No size selected');
      this.snackBar.open('Please select a size', 'Close', { duration: 3000 });
      return;
    }
    
    const stock = this.getInStock(this.selectedSize);
    if (stock && stock < this.quantity) {
      console.error(`[MerchandiseDetail] Cannot add to cart: Requested quantity (${this.quantity}) exceeds available stock (${stock})`);
      this.snackBar.open(`Sorry, only ${stock} items available in this size`, 'Close', { duration: 3000 });
      return;
    }
    
    console.log('[MerchandiseDetail] Creating cart item with the following data:');
    console.log(`- Merchandise ID: ${this.merchandise.id}`);
    console.log(`- Name: ${this.merchandise.name}`);
    console.log(`- Size: ${this.selectedSize}`);
    console.log(`- Quantity: ${this.quantity}`);
    console.log(`- Price: ${this.merchandise.price}`);
    
    const cartItem = {
      merchId: this.merchandise.id,
      name: this.merchandise.name,
      size: this.selectedSize,
      quantity: this.quantity,
      price: this.merchandise.price,
      imageUrl: this.selectedImage?.imageUrl
    };
    
    console.log('[MerchandiseDetail] Final cart item:', cartItem);
    
    try {
      this.cartService.addToCart(cartItem);
      console.log('[MerchandiseDetail] Item successfully added to cart');
      
      this.snackBar.open('Added to cart!', 'View Cart', {
        duration: 3000
      }).onAction().subscribe(() => {
        console.log('[MerchandiseDetail] Navigating to cart page');
        this.router.navigate(['/cart']);
      });
    } catch (error) {
      console.error('[MerchandiseDetail] Error adding item to cart:', error);
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
    this.merchandise.ratings.push(newRating); // Optimistic update
  
    this.ratingService.insertRating(newRating).subscribe({
      next: () => {
        console.log("Rating added successfully!");
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
              this.selectedImage = null; // Reset selected image
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
    console.log('[MerchandiseDetail] Selecting image:', image);
    this.selectedImage = image;
  }

  selectSize(size: string): void {
    console.log(`[MerchandiseDetail] Selecting size: ${size}`);
    this.selectedSize = size;
  }

  getStockForSize(size: string): number {
    if (!this.merchandise || !this.merchandise.sizes) {
      console.log('[MerchandiseDetail] No merchandise or sizes available to check stock');
      return 0;
    }
    
    const sizeObj = this.merchandise.sizes.find(s => s.size === size);
    const stock = sizeObj ? sizeObj.inStock : 0;
    console.log(`[MerchandiseDetail] Stock for size ${size}: ${stock}`);
    return stock;
  }

  incrementQuantity(): void {
    console.log(`[MerchandiseDetail] Incrementing quantity from ${this.quantity}`);
    const stock = this.getInStock(this.selectedSize);
    if (stock && this.quantity < stock) {
      this.quantity++;
      console.log(`[MerchandiseDetail] New quantity: ${this.quantity}`);
    } else {
      console.log(`[MerchandiseDetail] Cannot increment: at max stock (${stock})`);
      this.snackBar.open(`Sorry, only ${stock} items available in this size`, 'Close', { duration: 3000 });
    }
  }

  decrementQuantity(): void {
    console.log(`[MerchandiseDetail] Decrementing quantity from ${this.quantity}`);
    if (this.quantity > 1) {
      this.quantity--;
      console.log(`[MerchandiseDetail] New quantity: ${this.quantity}`);
    } else {
      console.log('[MerchandiseDetail] Cannot decrement: already at minimum quantity (1)');
    }
  }

  getFullImageUrl(relativeUrl: string): string {
    // Convert relative URL to absolute URL pointing to the backend
    if (relativeUrl && relativeUrl.startsWith('/')) {
      return `${environment.apiUrl}${relativeUrl}`;
    }
    return relativeUrl;
  }
}