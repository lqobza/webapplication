import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../models/cartitem.model';
import { MerchandiseService } from './merchandise.service';
import { Merchandise } from '../models/merchandise.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItems$ = new BehaviorSubject<CartItem[]>([]);
  private merchandiseDetails: Map<number, Merchandise> = new Map();

  constructor(private merchandiseService: MerchandiseService) {
    this.loadCartFromStorage();
  }

  /**
   * Load cart items from localStorage on initialization.
   */
  private loadCartFromStorage(): void {
    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      this.cartItems = JSON.parse(storedCartItems);
      this.cartItems$.next(this.cartItems);
      this.fetchMerchandiseDetails().catch((error) => {
        console.error('Failed to fetch merchandise details:', error);
      });
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
    return this.cartItems.find(
      (item) => item.merchandiseId === merchandiseId && item.size === size
    );
  }

  /**
   * Add an item to the cart or update its quantity if it already exists.
   */
  addToCart(item: CartItem): void {
    const existingItem = this.getCartItem(item.merchandiseId, item.size);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push(item);
    }
    this.saveCart();
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
    if (quantity < 1 || quantity > 100) return; // Prevent invalid quantities
    item.quantity = quantity;
    this.saveCart();
  }
  
  /**
   * Fetch merchandise details for all items in the cart.
   */
  private async fetchMerchandiseDetails(): Promise<void> {
    const ids = Array.from(new Set(this.cartItems.map((item) => item.merchandiseId)));
    try {
      const merchandiseArray = await Promise.all(
        ids.map((id) => this.merchandiseService.getMerchandiseById(id).toPromise())
      );
      merchandiseArray.forEach((merch) => {
        if (merch) {
          this.merchandiseDetails.set(merch.id!, merch);
        }
      });
    } catch (error) {
      console.error('Failed to fetch merchandise details:', error);
      throw error; // Re-throw the error for handling in the component
    }
  }

  /**
   * Calculate the total price of all items in the cart.
   */
  getTotalPrice(): number {
    return this.cartItems.reduce((sum, item) => {
      const merch = this.merchandiseDetails.get(item.merchandiseId);
      return sum + (merch ? merch.price * item.quantity : 0);
    }, 0);
  }

  /**
   * Get merchandise details by ID.
   */
  getMerchandiseDetails(merchandiseId: number): Merchandise | undefined {
    return this.merchandiseDetails.get(merchandiseId);
  }

  /**
   * Check if the cart is empty.
   */
  isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  /**
   * Save the current cart state to localStorage and emit the updated cart items.
   */
  private saveCart(): void {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    this.cartItems$.next(this.cartItems); // Emit the updated cart items
  }
}