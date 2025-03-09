import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { CartItem } from '../models/cartitem.model';
import { MerchandiseService } from './merchandise.service';
import { Merchandise } from '../models/merchandise.model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItems$ = new BehaviorSubject<CartItem[]>([]);
  private merchandiseDetails: Map<number, Merchandise> = new Map();

  constructor(
    private merchandiseService: MerchandiseService, 
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('[CartService] Initializing cart service');
    this.loadCartFromStorage();
  }

  /**
   * Load cart items from localStorage on initialization.
   */
  private async loadCartFromStorage(): Promise<void> {
    console.log('[CartService] Loading cart from storage');
    if (!this.authService.isLoggedIn()) {
      console.log('[CartService] User not logged in, clearing cart');
      this.clearCart();
      return Promise.resolve();
    }

    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      console.log('[CartService] Found stored cart items');
      try {
        this.cartItems = JSON.parse(storedCartItems);
        console.log('[CartService] Parsed cart items:', this.cartItems);
        
        // First fetch merchandise details, then emit cart items
        await this.fetchMerchandiseDetails().catch((error) => {
          console.error('[CartService] Failed to fetch merchandise details:', error);
        });
        this.cartItems$.next(this.cartItems);
      } catch (error) {
        console.error('[CartService] Error parsing stored cart items:', error);
        this.clearCart();
      }
    } else {
      console.log('[CartService] No stored cart items found');
    }
  }

  /**
   * Get an observable of the cart items.
   */
  getCartItems(): Observable<CartItem[]> {
    console.log('[CartService] Getting cart items observable');
    return this.cartItems$.asObservable();
  }

  /**
   * Get a specific cart item by merchandise ID and size.
   */
  getCartItem(merchandiseId: number, size: string): CartItem | undefined {
    console.log(`[CartService] Looking for cart item with merchId=${merchandiseId}, size=${size}`);
    const item = this.cartItems.find(
      (item) => item.merchId === merchandiseId && item.size === size
    );
    console.log('[CartService] Found item:', item);
    return item;
  }

  /**
   * Add an item to the cart or update its quantity if it already exists.
   */
  addToCart(product: any): void {
    console.log('[CartService] Adding to cart:', product);
    
    // For custom products, always add as new item
    if (product.designUrl) {
      console.log('[CartService] Adding custom product with design URL');
      this.cartItems.push({
        ...product,
        quantity: 1
      });
    } else {
      // Check if merchandise details are available
      console.log(`[CartService] Looking for merchandise details for ID: ${product.merchandiseId || product.merchId}`);
      const merchId = product.merchandiseId || product.merchId;
      const merch = this.merchandiseDetails.get(merchId);
      console.log('[CartService] Found merchandise details:', merch);
      
      let imageUrl: string | undefined;
      
      // Get image URL if available
      if (merch?.images && merch.images.length > 0) {
        const primaryImage = merch.images.find(img => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.imageUrl : merch.images[0].imageUrl;
        console.log('[CartService] Using image URL:', imageUrl);
      }
      
      // Existing logic for regular products
      const existingItem = this.cartItems.find(item => 
        item.merchId === merchId && item.size === product.size
      );
      
      if (existingItem) {
        console.log('[CartService] Updating existing item quantity');
        existingItem.quantity += product.quantity || 1;
      } else {
        console.log('[CartService] Adding new item to cart');
        this.cartItems.push({
          ...product,
          merchId: merchId,
          quantity: product.quantity || 1,
          imageUrl: imageUrl
        });
      }
    }
    
    console.log('[CartService] Updated cart items:', this.cartItems);
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    this.cartItems$.next(this.cartItems);
  }

  /**
   * Remove an item from the cart.
   */
  removeItem(item: CartItem): void {
    console.log('[CartService] Removing item from cart:', item);
    this.cartItems = this.cartItems.filter((cartItem) => cartItem !== item);
    this.saveCart();
  }

  /**
   * Clear the entire cart.
   */
  clearCart(): void {
    console.log('[CartService] Clearing cart');
    this.cartItems = [];
    this.merchandiseDetails.clear();
    localStorage.removeItem('cartItems');
    this.cartItems$.next(this.cartItems);
  }

  /**
   * Update the quantity of a specific cart item.
   */
  updateQuantity(item: CartItem, quantity: number): void {
    console.log(`[CartService] Updating quantity for item to ${quantity}:`, item);
    if (quantity < 1 || quantity > 100) {
      console.log(`[CartService] Invalid quantity: ${quantity}`);
      return; // Prevent invalid quantities
    }
    item.quantity = quantity;
    this.saveCart();
  }
  
  /**
   * Fetch merchandise details for all items in the cart.
   */
  private async fetchMerchandiseDetails(): Promise<void> {
    const ids = Array.from(new Set(this.cartItems.map((item) => item.merchId)));
    console.log('[CartService] Fetching merchandise details for IDs:', ids);
    
    if (ids.length === 0) {
      console.log('[CartService] No merchandise IDs to fetch');
      return;
    }
    
    try {
      const merchandiseArray = await Promise.all(
        ids.map((id) => {
          console.log(`[CartService] Fetching merchandise with ID: ${id}`);
          return this.merchandiseService.getMerchandiseById(id).toPromise();
        })
      );
      
      console.log('[CartService] Fetched merchandise details:', merchandiseArray);
      
      merchandiseArray.forEach((merch) => {
        if (merch) {
          console.log(`[CartService] Processing merchandise: ${merch.id} - ${merch.name}`);
          this.merchandiseDetails.set(merch.id!, merch);
          
          // Update cart items with image URLs and names
          this.cartItems.forEach(item => {
            if (item.merchId === merch.id) {
              console.log(`[CartService] Updating cart item with merchandise details: ${item.merchId}`);
              
              // Update name if missing
              if (!item.name) {
                console.log(`[CartService] Setting name to: ${merch.name}`);
                item.name = merch.name;
              }
              
              // Find primary image or use first available
              if (merch.images && merch.images.length > 0) {
                const primaryImage = merch.images.find(img => img.isPrimary);
                const imageUrl = primaryImage ? primaryImage.imageUrl : merch.images[0].imageUrl;
                console.log(`[CartService] Setting image URL to: ${imageUrl}`);
                item.imageUrl = imageUrl;
              }
            }
          });
        }
      });
      
      // Save updated cart items with image URLs and names
      this.saveCart();
    } catch (error) {
      console.error('[CartService] Failed to fetch merchandise details:', error);
      throw error; // Re-throw the error for handling in the component
    }
  }

  /**
   * Calculate the total price of all items in the cart.
   */
  getTotalPrice(): number {
    const total = this.cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    console.log(`[CartService] Calculated total price: ${total}`);
    return total;
  }

  /**
   * Get merchandise details by ID.
   */
  getMerchandiseDetails(merchandiseId: number): Merchandise | undefined {
    console.log(`[CartService] Getting merchandise details for ID: ${merchandiseId}`);
    const details = this.merchandiseDetails.get(merchandiseId);
    console.log('[CartService] Found merchandise details:', details);
    return details;
  }

  /**
   * Check if the cart is empty.
   */
  isCartEmpty(): boolean {
    const isEmpty = this.cartItems.length === 0;
    console.log(`[CartService] Cart is empty: ${isEmpty}`);
    return isEmpty;
  }

  /**
   * Save the current cart state to localStorage and emit the updated cart items.
   */
  private saveCart(): void {
    console.log('[CartService] Saving cart');
    if (this.authService.isLoggedIn()) {
      localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
      console.log('[CartService] Cart saved to localStorage');
      this.cartItems$.next(this.cartItems); // Emit the updated cart items
    } else {
      console.log('[CartService] User not logged in, cart not saved');
    }
  }

  getItemPrice(item: CartItem): number {
    const price = item.price * item.quantity;
    console.log(`[CartService] Calculated item price: ${price} for item:`, item);
    return price;
  }

  createOrder(customerName: string, customerEmail: string, customerAddress: string): Observable<any> {
    console.log('[CartService] Creating order with customer info:', { customerName, customerEmail, customerAddress });
    
    if (!this.authService.isLoggedIn()) {
      console.log('[CartService] User not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return EMPTY;
    }

    // Get the current user ID from the auth service
    const userId = this.authService.getCurrentUserId();
    console.log(`[CartService] Current user ID: ${userId}`);

    const orderCreateDto = {
      userId: userId,
      customerName,
      customerEmail,
      customerAddress,
      status: "Created",
      items: this.cartItems.map((item) => {
        const orderItem = {
          merchId: item.merchId,
          size: item.size,
          quantity: item.quantity,
          price: this.getItemPrice(item),
        };
        console.log('[CartService] Created order item:', orderItem);
        return orderItem;
      }),
    };

    console.log('[CartService] Final order create DTO:', orderCreateDto);
    const apiUrl = `${environment.apiUrl}/api/order/create`;
    console.log(`[CartService] Sending POST request to: ${apiUrl}`);
    return this.http.post(apiUrl, orderCreateDto);
  }

  updateMerchandiseDetails(merchandise: Merchandise): void {
    console.log('[CartService] Updating merchandise details:', merchandise);
    
    if (merchandise && merchandise.id) {
      // Check if we already have this merchandise with the same data
      const existingMerch = this.merchandiseDetails.get(merchandise.id);
      if (existingMerch && 
          existingMerch.name === merchandise.name && 
          JSON.stringify(existingMerch.images) === JSON.stringify(merchandise.images)) {
        // Skip update if the merchandise data hasn't changed
        console.log('[CartService] Skipping update, merchandise data unchanged');
        return;
      }
      
      // Update the merchandise details
      console.log(`[CartService] Updating merchandise details for ID: ${merchandise.id}`);
      this.merchandiseDetails.set(merchandise.id, merchandise);
      
      // Update cart items with image URLs and names if needed
      let cartUpdated = false;
      this.cartItems.forEach(item => {
        if (item.merchId === merchandise.id) {
          console.log(`[CartService] Updating cart item with merchandise details: ${item.merchId}`);
          
          // Update name if missing
          if (!item.name) {
            console.log(`[CartService] Setting name to: ${merchandise.name}`);
            item.name = merchandise.name;
            cartUpdated = true;
          }
          
          // Update image URL if missing
          if (!item.imageUrl && merchandise.images && merchandise.images.length > 0) {
            const primaryImage = merchandise.images.find(img => img.isPrimary);
            item.imageUrl = primaryImage ? primaryImage.imageUrl : merchandise.images[0].imageUrl;
            console.log(`[CartService] Setting image URL to: ${item.imageUrl}`);
            cartUpdated = true;
          }
        }
      });
      
      // Only save if cart was actually updated
      if (cartUpdated) {
        console.log('[CartService] Cart updated with merchandise details, saving');
        this.saveCart();
      }
    }
  }
}