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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMerchandise();
  }

  loadMerchandise(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.route.paramMap.subscribe(params => {
      const merchId = Number(params.get('id'));

      if (isNaN(merchId)) {
        this.errorMessage = "Invalid Merchandise ID";
        this.isLoading = false;
        return;
      }

      this.merchandiseService.getMerchandiseById(merchId)
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
            console.error('Error fetching merchandise', err);
            this.errorMessage = err.message || "Error fetching merchandise";
            this.isLoading = false;
            this.merchandise = undefined;
            this.selectedSize = undefined;
            this.inStock = undefined;
          }
        });
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

  goToUpdatePage(merchandiseId: number | undefined) {
    if (merchandiseId) {
      this.router.navigate(['/update', merchandiseId]);
    } else {
      console.error("Merchandise ID is undefined. Cannot navigate.");
    }
  }
  
  addToCart() {
    if (!this.merchandise || !this.quantity) {
      return;
    }

    let selectedMerchSize = this.merchandise.sizes?.find(s => s.size === this.selectedSize);

    // If only one size exists and size is null, use it
    if (!this.hasMultipleSizes && this.merchandise.sizes?.length === 1) {
      selectedMerchSize = this.merchandise.sizes[0];
    }

    if (selectedMerchSize) {
      this.cartService.addToCart({
        merchandiseId: this.merchandise.id!,
        size: selectedMerchSize.size ?? 'One Size',
        quantity: this.quantity,
        price: this.merchandise.price
      });
      

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
    this.selectedImage = image;
  }

  getFullImageUrl(relativeUrl: string): string {
    // Convert relative URL to absolute URL pointing to the backend
    if (relativeUrl && relativeUrl.startsWith('/')) {
      return `http://localhost:5214${relativeUrl}`;
    }
    return relativeUrl;
  }
}