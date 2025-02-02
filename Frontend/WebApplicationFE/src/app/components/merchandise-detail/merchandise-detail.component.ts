import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Merchandise } from '../../models/merchandise.model';
import { MerchandiseService } from '../../services/merchandise.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-merchandise-detail',
  templateUrl: './merchandise-detail.component.html',
  styleUrls: ['./merchandise-detail.component.css']
})
export class MerchandiseDetailComponent implements OnInit {
  merchandise: Merchandise | undefined;
  isLoading = true;
  errorMessage: string | undefined;
  selectedSize: string | undefined;
  inStock: number | undefined;
  quantity: number = 1;
  hasMultipleSizes: boolean = false;
  isAddToCartDisabled: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private merchandiseService: MerchandiseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('MerchandiseDetailComponent initialized');
    this.loadMerchandise();
  }

  loadMerchandise(): void {
    this.isLoading = true;
    this.errorMessage = undefined;
  
    this.route.paramMap.subscribe(params => {
      const merchId = Number(params.get('id'));
  
      if (isNaN(merchId)) {
        this.errorMessage = "Invalid Merchandise ID";
        this.isLoading = false;
        return;
      }
  
      this.merchandiseService.getMerchandiseById(merchId).subscribe({
        next: (data) => {
          this.merchandise = data;
          console.log('Merchandise data received', data);
          this.isLoading = false;
  
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
        },
        error: (error) => {
          console.error('Error fetching merchandise', error);
          this.errorMessage = error.message || "Error fetching merchandise";
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
      console.log('Adding to cart:', {
        merchandiseId: this.merchandise.id,
        size: selectedMerchSize.size ?? 'One Size',
        quantity: this.quantity,
        price: this.merchandise.price
      });
      // Call your cart service here
    }
  }
}