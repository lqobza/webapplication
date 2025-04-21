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

  customerName: string = '';
  customerEmail: string = '';
  customerAddress: string = '';
  
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
    if (!this.authService.isLoggedIn()) {
      return;
    }
    
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && currentUser.token) {
      try {
        const tokenParts = currentUser.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          if (payload.sub) {
            this.customerName = payload.sub;
          }
          
          if (payload.email) {
            this.customerEmail = payload.email;
          }
        }
      } catch (error) {
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
        
        if (!this.isFetchingDetails) {
          this.loadMerchandiseDetails();
        }
        
        this.checkItemsStockAvailability();
      },
      error: () => {
        this.errorMessage = 'Failed to load cart items. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  loadMerchandiseDetails(): void {
    if (this.isFetchingDetails) {
      return;
    }

    if (this.cartItems.length === 0) {
      this.isLoading = false;
      return;
    }

    const itemsNeedingDetails = this.cartItems.filter(item => !item.imageUrl || !item.name);
    
    if (itemsNeedingDetails.length === 0) {
      this.isLoading = false;
      return;
    }

    this.isFetchingDetails = true;

    const merchandiseIds = [...new Set(itemsNeedingDetails.map(item => item.merchId))];
    
    const merchandiseObservables = merchandiseIds.map(id => 
      this.merchandiseService.getMerchandiseById(id).pipe(
        catchError(error => {
          return of(null);
        })
      )
    );
    
    forkJoin(merchandiseObservables)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.isFetchingDetails = false;
        })
      )
      .subscribe({
        next: (merchandiseArray) => {
          merchandiseArray.forEach(merch => {
            if (merch) {
              this.cartService.updateMerchandiseDetails(merch);
            }
          });
        },
        error: (error) => {
        }
      });
  }

  getImageUrl(item: CartItem): string | SafeUrl {
    if ((item.id && item.id.toString().startsWith('custom-')) || item.isCustom) {
      if (item.frontImage) {
        return this.sanitizer.bypassSecurityTrustUrl(item.frontImage);
      }
    }
    
    if (item.imageUrl) {
      if (item.imageUrl.startsWith('/')) {
        return `${environment.apiUrl}${item.imageUrl}`;
      }
      return item.imageUrl;
    }
    
    const merch = this.cartService.getMerchandiseDetails(item.merchId);
    if (merch?.images && merch.images.length > 0) {
      const primaryImage = merch.images.find(img => img.isPrimary);
      const imageUrl = primaryImage ? primaryImage.imageUrl : merch.images[0].imageUrl;
      
      if (imageUrl.startsWith('/')) {
        return `${environment.apiUrl}${imageUrl}`;
      }
      return imageUrl;
    }
    
    return 'assets/images/placeholder.png';
  }

  //getItemPrice(item: CartItem): number {
  //  return Math.round(item.price * item.quantity);
  //}

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  updateQuantity(index: number, quantity: number | string): void {
    let newQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    } else if (newQuantity > 100) {
      newQuantity = 100;
    }

    this.cartService.updateQuantity(this.cartItems[index], newQuantity);
    
    const item = this.cartItems[index];
    if (!item.isCustom && item.merchId) {
      this.merchandiseService.checkStockAvailability(item.merchId, item.size, newQuantity)
        .pipe(catchError(() => of({ isAvailable: true, available: 999 })))
        .subscribe(result => {
          if (!result.isAvailable) {
            item.stockWarning = true;
            item.availableStock = result.available;
          } else {
            item.stockWarning = false;
            item.availableStock = result.available;
          }
        });
    }
  }

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

    if (this.cartItems.length === 0) {
      this.orderError = 'Your cart is empty. Please add items before placing an order.';
      this.orderSubmitting = false;
      return;
    }

    this.checkStockAvailability().pipe(
      switchMap(stockCheckResult => {
        if (!stockCheckResult.success) {
          this.orderSubmitting = false;
          this.orderError = stockCheckResult.message || 'Stock check failed';
          return of(null);
        }

        return this.cartService.createOrder(
          this.customerName,
          this.customerEmail,
          this.customerAddress
        );
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          this.orderSubmitting = false;
          this.orderSuccess = true;
          
          this.cartService.clearCart();
          this.cartItems = [];
        }
      },
      error: (error) => {
        this.orderSubmitting = false;
        
        //console.error('Order creation error:', error);
        
        if (error.error && error.error.message) {
          if (error.error.message.includes('Insufficient stock') || 
              error.error.message.includes('not found in stock')) {
            this.orderError = error.error.message;
            
            this.checkItemsStockAvailability();
          } else {
            this.orderError = error.error.message;
          }
        } else if (error.status === 0) {
          this.orderError = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          this.orderError = 'Failed to create order. Please try again later.';
        }
      }
    });
  }

  checkStockAvailability() {
    const regularItems = this.cartItems.filter(item => !item.isCustom && item.merchId);
    
    if (regularItems.length === 0) {
      return of({ success: true } as StockCheckResult);
    }
    
    const stockCheckObservables = regularItems.map(item => 
      this.merchandiseService.checkStockAvailability(item.merchId, item.size, item.quantity).pipe(
        catchError(error => {
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
    
    return forkJoin(stockCheckObservables).pipe(
      switchMap(results => {
        const insufficientStockItems = results.filter(result => !result.isAvailable);
        
        if (insufficientStockItems.length > 0) {
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
        
        return of({ success: true } as StockCheckResult);
      })
    );
  }

  goToShop(): void {
    this.router.navigate(['/merchandise']);
  }

  checkItemsStockAvailability(): void {
    const regularItems = this.cartItems.filter(item => !item.isCustom && item.merchId);
    
    if (regularItems.length === 0) {
      return;
    }
    
    regularItems.forEach(item => {
      this.merchandiseService.checkStockAvailability(item.merchId, item.size, item.quantity)
        .pipe(catchError(() => of({ isAvailable: true, available: 999 })))
        .subscribe(result => {
          if (!result.isAvailable) {
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