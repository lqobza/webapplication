import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Merchandise } from '../../models/merchandise.model';
import { MerchandiseService } from '../../services/merchandise.service';
import { RatingService } from '../../services/rating.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    this.errorMessage = null;

    this.merchandiseService.getMerchandiseById(id)
      .subscribe({
        next: (data) => {
          this.merchandise = data;

          if (this.merchandise && this.merchandise.sizes) {
            const notNullSizes = this.merchandise.sizes.filter(s => s.size !== null);
            this.hasMultipleSizes = notNullSizes.length > 1;

            if (this.isAccessoryItem()) {
              this.selectedSize = undefined;
              this.inStock = this.getAccessoryStock();
            } 
            else if (notNullSizes.length > 0) {
              this.selectedSize = notNullSizes[0].size;
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
          this.errorMessage = err.message;
          this.merchandise = undefined;
          this.selectedSize = undefined;
          this.inStock = undefined;
          this.snackBar.open('Failed to load merchandise', 'Close', { duration: 3000 });
        }
      });
  }
  
  onSizeChange(): void {
    this.inStock = this.getInStock(this.selectedSize);
    this.quantity = 1;
  }

  getInStock(size: string | undefined): number | undefined {
    if (!this.merchandise) 
      return undefined;

    return size ? this.merchandise.sizes?.find(s => s.size === size)?.inStock : undefined;
  }

  private isAccessoryItem(): boolean {
    return !!this.merchandise?.sizes 
      && this.merchandise.sizes.length === 1 
      && this.merchandise.sizes[0]?.size === null;
  }

  private getAccessoryStock(): number | undefined {
    if (this.isAccessoryItem() && this.merchandise?.sizes?.[0]) {
      return this.merchandise.sizes[0].inStock;
    }
    return undefined;
  }

  get isAddToCartEnabled(): boolean {
    if (!this.merchandise) return false;

    if (this.isAccessoryItem()) {
      const stock = this.getAccessoryStock();
      return stock !== undefined && stock > 0;
    }

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
    if (this.isAccessoryItem()) {
      const stock = this.getAccessoryStock();
      return stock !== undefined && stock > 0 ? stock : 1;
    }

    if (this.hasMultipleSizes) {
      const inStock = this.getInStock(this.selectedSize);
      return inStock !== undefined && inStock > 0 ? inStock : 1;
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
    
    const isAccessory = this.isAccessoryItem();
    
    if (!isAccessory && !this.selectedSize) {
      this.snackBar.open('Please select a size', 'Close', { duration: 3000 });
      return;
    }
    
    const stock = isAccessory ? this.getAccessoryStock() : this.getInStock(this.selectedSize);
    
    if (stock !== undefined && stock < this.quantity) {
      this.snackBar.open(`Only ${stock} items avilable`, 'Close', { duration: 3000 });
      return;
    }
    
    const cartItem = {
      id: this.merchandise.id,
      merchId: this.merchandise.id,
      name: this.merchandise.name,
      size: isAccessory ? null : this.selectedSize,
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
    });
  }

  refreshRatings() {
    if (!this.merchandise?.id) return;
    this.merchandiseService.getMerchandiseById(this.merchandise.id).subscribe({
      next: (data) => this.merchandise!.ratings = data.ratings,
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
    const isAccessory = this.isAccessoryItem();
    const stock = isAccessory ? this.getAccessoryStock() : this.getInStock(this.selectedSize);
    
    if (stock !== undefined && this.quantity < stock) {
      this.quantity++;
    } else {
      this.snackBar.open(`Only ${stock} items avilable`, 'Close', { duration: 3000 });
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