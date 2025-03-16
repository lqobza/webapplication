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
    this.loadCartFromStorage();
  }

  /**
   * Load cart items from localStorage on initialization.
   */
  private async loadCartFromStorage(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.clearCart();
      return Promise.resolve();
    }

    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      try {
        this.cartItems = JSON.parse(storedCartItems);
        
        // First fetch merchandise details, then emit cart items
        await this.fetchMerchandiseDetails().catch((error) => {
          console.error('[CartService] Failed to fetch merchandise details:', error);
        });
        this.cartItems$.next(this.cartItems);
      } catch (error) {
        console.error('[CartService] Error parsing stored cart items:', error);
        this.clearCart();
      }
    }
  }

  /**
   * Get an observable of the cart items.
   */
  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$.asObservable();
  }

  /**
   * Get a specific cart item by merchandise ID and size.
   */
  getCartItem(merchandiseId: number, size: string): CartItem | undefined {
    const item = this.cartItems.find(
      (item) => item.merchId === merchandiseId && item.size === size
    );
    return item;
  }

  /**
   * Add an item to the cart or update its quantity if it already exists.
   */
  addToCart(item: any): void {
    // Check if the item is a custom product
    const isCustomProduct = (item.id && item.id.toString().startsWith('custom-')) || item.isCustom;
    
    let cartItem: CartItem;
    
    if (isCustomProduct) {
      // For custom merchandise, ensure we have a name
      const designName = item.name || 'Custom T-Shirt Design';
      
      cartItem = {
        id: item.id,
        merchId: parseInt(item.id.split('-')[1]) || 0, // Extract the design ID, default to 0 if parsing fails
        name: designName,
        size: item.size || 'M',
        quantity: item.quantity || 1,
        price: item.price || 30,
        frontImage: item.frontImage, // This contains the actual image data
        backImage: item.backImage,
        isCustom: true
      };
    } else {
      // Handle regular merchandise
      cartItem = {
        merchId: item.merchId || item.id, // Use merchId if available, otherwise use id
        name: item.name,
        size: item.size || 'M',
        quantity: item.quantity || 1,
        price: item.price,
        imageUrl: item.imageUrl
      };
    }

    // Check if the item is already in the cart
    const existingItemIndex = this.cartItems.findIndex(i => 
      i.merchId === cartItem.merchId && 
      i.size === cartItem.size && 
      (i.isCustom === cartItem.isCustom) &&
      (i.id === cartItem.id) // Also check the ID for custom items
    );

    if (existingItemIndex !== -1) {
      // Update quantity if the item is already in the cart
      this.cartItems[existingItemIndex].quantity += cartItem.quantity;
    } else {
      // Add new item to the cart
      this.cartItems.push(cartItem);
    }

    // Update local storage
    this.saveCart();
    
    // Notify subscribers
    this.cartItems$.next(this.cartItems);
  }

  /**
   * Remove an item from the cart.
   */
  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter((cartItem) => cartItem !== item);
    this.saveCart();
  }

  /**
   * Clear the entire cart.
   */
  clearCart(): void {
    this.cartItems = [];
    this.merchandiseDetails.clear();
    localStorage.removeItem('cartItems');
    this.cartItems$.next(this.cartItems);
  }

  /**
   * Update the quantity of a specific cart item.
   */
  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1 || quantity > 100) {
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
    
    if (ids.length === 0) {
      return;
    }
    
    try {
      const merchandiseArray = await Promise.all(
        ids.map((id) => {
          return this.merchandiseService.getMerchandiseById(id).toPromise();
        })
      );
      
      merchandiseArray.forEach((merch) => {
        if (merch) {
          this.merchandiseDetails.set(merch.id!, merch);
          
          // Update cart items with image URLs and names
          this.cartItems.forEach(item => {
            if (item.merchId === merch.id) {
              // Update name if missing
              if (!item.name) {
                item.name = merch.name;
              }
              
              // Find primary image or use first available
              if (merch.images && merch.images.length > 0) {
                const primaryImage = merch.images.find(img => img.isPrimary);
                const imageUrl = primaryImage ? primaryImage.imageUrl : merch.images[0].imageUrl;
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
      return sum + Math.round(item.price * item.quantity);
    }, 0);
    return total;
  }

  /**
   * Get merchandise details by ID.
   */
  getMerchandiseDetails(merchandiseId: number): Merchandise | undefined {
    const details = this.merchandiseDetails.get(merchandiseId);
    return details;
  }

  /**
   * Check if the cart is empty.
   */
  isCartEmpty(): boolean {
    const isEmpty = this.cartItems.length === 0;
    return isEmpty;
  }

  /**
   * Save the current cart state to localStorage and emit the updated cart items.
   */
  private saveCart(): void {
    if (this.authService.isLoggedIn()) {
      try {
        localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
      } catch (e) {
        console.error('Error saving cart to localStorage:', e);
        // If the error is due to quota exceeded, try removing the images
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          // Create a copy without the large image data
          const cartWithoutImages = this.cartItems.map(item => {
            const copy = {...item};
            if (copy.frontImage) {
              // Store just the first 100 chars to identify it's a custom item
              copy.frontImage = copy.frontImage.substring(0, 100);
            }
            if (copy.backImage) {
              copy.backImage = copy.backImage.substring(0, 100);
            }
            return copy;
          });
          localStorage.setItem('cartItems', JSON.stringify(cartWithoutImages));
        }
      }
      this.cartItems$.next(this.cartItems); // Emit the updated cart items
    }
  }

  getItemPrice(item: CartItem): number {
    const price = Math.round(item.price * item.quantity);
    return price;
  }

  createOrder(customerName: string, customerEmail: string, customerAddress: string): Observable<any> {
    // Format cart items for the order
    const orderItems = this.cartItems.map(item => {
      // Check if this is a custom merchandise item
      const isCustomItem = (item.id && item.id.toString().startsWith('custom-')) || item.isCustom;
      
      if (isCustomItem) {
        // For custom items, extract the design ID from the custom ID
        const designId = item.id ? parseInt(item.id.toString().split('-')[1]) : 0;
        
        return {
          MerchId: designId,
          Size: item.size,
          Quantity: item.quantity,
          Price: item.price * item.quantity,
          MerchandiseName: item.name || 'Custom T-Shirt Design',
          ImageUrl: item.frontImage,
          IsCustom: true
        };
      } else {
        // Regular merchandise item
        return {
          MerchId: item.merchId,
          Size: item.size,
          Quantity: item.quantity,
          Price: item.price * item.quantity,
          MerchandiseName: item.name,
          ImageUrl: item.imageUrl,
          IsCustom: false
        };
      }
    });
    
    // Create the order object
    const order = {
      CustomerName: customerName,
      CustomerEmail: customerEmail,
      CustomerAddress: customerAddress,
      Items: orderItems
    };
    
    // Send the order to the backend
    return this.http.post(`${environment.apiUrl}/api/order/create`, order);
  }

  updateMerchandiseDetails(merchandise: Merchandise): void {
    if (merchandise && merchandise.id) {
      // Check if we already have this merchandise with the same data
      const existingMerch = this.merchandiseDetails.get(merchandise.id);
      if (existingMerch && 
          existingMerch.name === merchandise.name && 
          JSON.stringify(existingMerch.images) === JSON.stringify(merchandise.images)) {
        // Skip update if the merchandise data hasn't changed
        return;
      }
      
      // Update the merchandise details
      this.merchandiseDetails.set(merchandise.id, merchandise);
      
      // Update cart items with image URLs and names if needed
      let cartUpdated = false;
      this.cartItems.forEach(item => {
        if (item.merchId === merchandise.id) {
          // Update name if missing
          if (!item.name) {
            item.name = merchandise.name;
            cartUpdated = true;
          }
          
          // Update image URL if missing
          if (!item.imageUrl && merchandise.images && merchandise.images.length > 0) {
            const primaryImage = merchandise.images.find(img => img.isPrimary);
            item.imageUrl = primaryImage ? primaryImage.imageUrl : merchandise.images[0].imageUrl;
            cartUpdated = true;
          }
        }
      });
      
      // Only save if cart was actually updated
      if (cartUpdated) {
        this.saveCart();
      }
    }
  }
}