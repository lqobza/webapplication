import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartitem.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MerchandiseService } from '../../services/merchandise.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  private isFetchingDetails: boolean = false;

  // Customer details for the order
  customerName: string = '';
  customerEmail: string = '';
  customerAddress: string = '';

  constructor(
    private cartService: CartService,
    private merchandiseService: MerchandiseService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.cartService.getCartItems().subscribe({
      next: (items: CartItem[]) => {
        this.cartItems = items;
        this.updateTotalPrice();
        
        // Load merchandise details for all items before showing the cart
        this.loadMerchandiseDetails();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cart items. Please try again later.';
        this.isLoading = false;
        console.error('Error loading cart:', error);
      },
    });
  }

  loadMerchandiseDetails(): void {
    // Prevent multiple simultaneous fetches
    if (this.isFetchingDetails) {
      return;
    }

    if (this.cartItems.length === 0) {
      this.isLoading = false;
      return;
    }

    // Only fetch details for items that don't have an imageUrl and name
    const itemsNeedingDetails = this.cartItems.filter(item => !item.imageUrl || !item.name);
    
    if (itemsNeedingDetails.length === 0) {
      this.isLoading = false;
      return; // No need to fetch details if all items have images and names
    }

    // Set the flag to prevent multiple fetches
    this.isFetchingDetails = true;

    // Get unique merchandise IDs for items that need details
    const merchandiseIds = [...new Set(itemsNeedingDetails.map(item => item.merchId))];
    
    // Create an array of observables for each merchandise
    const merchandiseObservables = merchandiseIds.map(id => 
      this.merchandiseService.getMerchandiseById(id).pipe(
        catchError(error => {
          console.error(`Error loading merchandise ${id}:`, error);
          return of(null); // Return null on error
        })
      )
    );
    
    // Wait for all merchandise details to load
    forkJoin(merchandiseObservables)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.isFetchingDetails = false; // Reset the flag when done
        })
      )
      .subscribe({
        next: (merchandiseArray) => {
          // Store merchandise details in the cart service
          merchandiseArray.forEach(merch => {
            if (merch) {
              // Force the cart service to update its merchandise details
              this.cartService.updateMerchandiseDetails(merch);
            }
          });
        },
        error: (error) => {
          console.error('Error loading merchandise details:', error);
        }
      });
  }

  getImageUrl(item: CartItem): string {
    // First try to use the imageUrl from the cart item
    if (item.imageUrl) {
      // Convert relative URL to absolute URL pointing to the backend
      if (item.imageUrl.startsWith('/')) {
        return `${environment.apiUrl}${item.imageUrl}`;
      }
      return item.imageUrl;
    }
    
    // Fallback to getting from merchandise details
    const merch = this.cartService.getMerchandiseDetails(item.merchId);
    if (merch?.images && merch.images.length > 0) {
      const primaryImage = merch.images.find(img => img.isPrimary);
      const imageUrl = primaryImage ? primaryImage.imageUrl : merch.images[0].imageUrl;
      
      // Convert relative URL to absolute URL pointing to the backend
      if (imageUrl.startsWith('/')) {
        return `${environment.apiUrl}${imageUrl}`;
      }
      return imageUrl;
    }
    
    // Final fallback
    return 'assets/images/placeholder.png';
  }

  getItemPrice(item: CartItem): number {
    return item.price * item.quantity;
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  updateQuantity(index: number, quantity: number | string): void {
    let newQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

    // Validate input
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1; // Set to minimum quantity
    } else if (newQuantity > 100) {
      newQuantity = 100; // Set to maximum quantity
    }

    // Update the quantity
    this.cartService.updateQuantity(this.cartItems[index], newQuantity);
  }

  /**
   * Update the total price of the cart.
   */
  updateTotalPrice(): void {
    this.totalPrice = this.cartService.getTotalPrice();
  }

  createOrder(): void {
    if (!this.customerName || !this.customerEmail || !this.customerAddress) {
      this.errorMessage = 'Please fill in all customer details.';
      return;
    }

    this.cartService.createOrder(this.customerName, this.customerEmail, this.customerAddress).subscribe({
      next: () => {
        alert('Order created successfully!');
        this.cartService.clearCart(); // Clear the cart after successful order creation
        this.cartItems = []; // Update the UI
        this.totalPrice = 0; // Reset the total price
      },
      error: (error) => {
        this.errorMessage = 'Failed to create order. Please try again later.';
        console.error('Error creating order:', error);
      },
    });
  }
}