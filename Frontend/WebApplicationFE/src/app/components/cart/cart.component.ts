import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartitem.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MerchandiseService } from '../../services/merchandise.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

// Interface for stock check result
interface StockCheckResult {
  success: boolean;
  message?: string;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
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
  
  // Order submission state
  orderSubmitting: boolean = false;
  orderSuccess: boolean = false;
  orderError: string | null = null;

  constructor(
    private cartService: CartService,
    private merchandiseService: MerchandiseService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
    this.loadUserData();
  }

  loadUserData(): void {
    // Skip if user is not logged in
    if (!this.authService.isLoggedIn()) {
      return;
    }
    
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && currentUser.token) {
      try {
        // Extract user data from JWT token
        const tokenParts = currentUser.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Extract username and email from token
          if (payload.sub) {
            this.customerName = payload.sub;
          }
          
          if (payload.email) {
            this.customerEmail = payload.email;
          }
        }
      } catch (error) {
        // Error decoding token
      }
    }
  }

  loadCartItems(): void {
    this.isLoading = true;
    this.cartService.getCartItems().subscribe({
      next: (items) => {
        this.cartItems = items;
        this.updateTotalPrice();
        this.isLoading = false;
        
        // Load merchandise details if not already fetching
        if (!this.isFetchingDetails) {
          this.loadMerchandiseDetails();
        }
        
        // Check stock availability for all non-custom items
        this.checkItemsStockAvailability();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cart items. Please try again later.';
        this.isLoading = false;
      }
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
          // Error loading merchandise details
        }
      });
  }

  getImageUrl(item: CartItem): string | SafeUrl {
    // Check if this is a custom merchandise item
    if ((item.id && item.id.toString().startsWith('custom-')) || item.isCustom) {
      // For custom merchandise, return the frontImage which contains the actual image data
      if (item.frontImage) {
        // Bypass security and trust the URL
        return this.sanitizer.bypassSecurityTrustUrl(item.frontImage);
      }
    }
    
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
    // Ensure price is an integer
    return Math.round(item.price * item.quantity);
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
    
    // Check stock availability for the updated item if it's not a custom item
    const item = this.cartItems[index];
    if (!item.isCustom && item.merchId) {
      this.merchandiseService.checkStockAvailability(item.merchId, item.size, newQuantity)
        .pipe(catchError(() => of({ isAvailable: true, available: 999 }))) // Default to available on error
        .subscribe(result => {
          if (!result.isAvailable) {
            // Update the item with stock warning
            item.stockWarning = true;
            item.availableStock = result.available;
          } else {
            item.stockWarning = false;
            item.availableStock = result.available;
          }
        });
    }
  }

  /**
   * Update the total price of the cart.
   */
  updateTotalPrice(): void {
    this.totalPrice = Math.round(this.cartService.getTotalPrice());
  }

  createOrder(): void {
    this.orderSubmitting = true;
    this.orderSuccess = false;
    this.orderError = null;
    
    if (!this.customerName || !this.customerEmail || !this.customerAddress) {
      this.orderError = 'Please fill in all customer details.';
      this.orderSubmitting = false;
      return;
    }

    // Check if there are any items in the cart
    if (this.cartItems.length === 0) {
      this.orderError = 'Your cart is empty. Please add items before placing an order.';
      this.orderSubmitting = false;
      return;
    }

    // First check stock availability for all non-custom items
    this.checkStockAvailability().pipe(
      switchMap(stockCheckResult => {
        if (!stockCheckResult.success) {
          // Stock check failed, don't proceed with order
          this.orderSubmitting = false;
          this.orderError = stockCheckResult.message || 'Stock check failed';
          return of(null);
        }

        // Stock check passed, proceed with order creation
        return this.cartService.createOrder(
          this.customerName,
          this.customerEmail,
          this.customerAddress
        );
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          // Order created successfully
          this.orderSubmitting = false;
          this.orderSuccess = true;
          
          // Clear the cart
          this.cartService.clearCart();
          this.cartItems = [];
        }
      },
      error: (error) => {
        this.orderSubmitting = false;
        
        console.error('Order creation error:', error);
        
        // Check if the error is related to stock issues
        if (error.error && error.error.message) {
          if (error.error.message.includes('Insufficient stock') || 
              error.error.message.includes('not found in stock')) {
            this.orderError = error.error.message;
            
            // Refresh stock information for all items
            this.checkItemsStockAvailability();
          } else {
            // Use the server's error message if available
            this.orderError = error.error.message;
          }
        } else if (error.status === 0) {
          // Network error
          this.orderError = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          // Generic error
          this.orderError = 'Failed to create order. Please try again later.';
        }
      }
    });
  }

  /**
   * Check stock availability for all non-custom items in the cart
   * @returns Observable with the check result
   */
  checkStockAvailability() {
    // Filter out custom items as they don't need stock check
    const regularItems = this.cartItems.filter(item => !item.isCustom && item.merchId);
    
    if (regularItems.length === 0) {
      // No regular items to check, proceed with order
      return of({ success: true } as StockCheckResult);
    }
    
    // Create an array of observables for each stock check
    const stockCheckObservables = regularItems.map(item => 
      this.merchandiseService.checkStockAvailability(item.merchId, item.size, item.quantity).pipe(
        catchError(error => {
          // Handle error for this specific item
          return of({ 
            isAvailable: false, 
            error: true,
            merchandiseName: item.name || `Item #${item.merchId}`,
            size: item.size,
            available: 0,
            requested: item.quantity
          });
        })
      )
    );
    
    // Wait for all stock checks to complete
    return forkJoin(stockCheckObservables).pipe(
      switchMap(results => {
        // Check if any item has insufficient stock
        const insufficientStockItems = results.filter(result => !result.isAvailable);
        
        if (insufficientStockItems.length > 0) {
          // Format error message for items with insufficient stock
          const firstItem = insufficientStockItems[0];
          let errorMessage = `Insufficient stock for '${firstItem.merchandiseName}' (Size: ${firstItem.size}). `;
          
          if (!firstItem.error) {
            errorMessage += `Requested: ${firstItem.requested}, Available: ${firstItem.available}`;
          }
          
          if (insufficientStockItems.length > 1) {
            errorMessage += ` and ${insufficientStockItems.length - 1} other item(s).`;
          }
          
          return of({ success: false, message: errorMessage } as StockCheckResult);
        }
        
        // All items have sufficient stock
        return of({ success: true } as StockCheckResult);
      })
    );
  }

  goToShop(): void {
    this.router.navigate(['/merchandise']);
  }

  /**
   * Check stock availability for all non-custom items and update their status
   */
  checkItemsStockAvailability(): void {
    // Only check regular merchandise items (not custom)
    const regularItems = this.cartItems.filter(item => !item.isCustom && item.merchId);
    
    if (regularItems.length === 0) {
      return;
    }
    
    // Check each item individually
    regularItems.forEach(item => {
      this.merchandiseService.checkStockAvailability(item.merchId, item.size, item.quantity)
        .pipe(catchError(() => of({ isAvailable: true, available: 999 }))) // Default to available on error
        .subscribe(result => {
          if (!result.isAvailable) {
            // Update the item with stock warning
            item.stockWarning = true;
            item.availableStock = result.available;
          } else {
            item.stockWarning = false;
            item.availableStock = result.available;
          }
        });
    });
  }
}