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

  private async loadCartFromStorage(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.clearCart();
      return Promise.resolve();
    }

    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      try {
        this.cartItems = JSON.parse(storedCartItems);
        
        await this.fetchMerchandiseDetails().catch((error) => {
          //console.error('[CartService] Failed to fetch merchandise details:', error);
        });
        this.cartItems$.next(this.cartItems);
      } catch (error) {
        //console.error('[CartService] Error parsing stored cart items:', error);
        this.clearCart();
      }
    }
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$.asObservable();
  }

  getCartItem(merchandiseId: number, size: string): CartItem | undefined {
    const item = this.cartItems.find(
      (item) => item.merchId === merchandiseId && item.size === size
    );
    return item;
  }

  addToCart(item: any): void {
    const isCustomProduct = (item.id && item.id.toString().startsWith('custom-')) || item.isCustom;
    
    let cartItem: CartItem;
    
    if (isCustomProduct) {
      const designName = item.name || 'Custom T-Shirt Design';
      
      cartItem = {
        id: item.id,
        merchId: parseInt(item.id.split('-')[1]) || 0,
        name: designName,
        size: item.size || 'M',
        quantity: item.quantity || 1,
        price: item.price || 30,
        frontImage: item.frontImage,
        backImage: item.backImage,
        isCustom: true
      };
    } else {
      cartItem = {
        merchId: item.merchId || item.id,
        name: item.name,
        size: item.size || 'M',
        quantity: item.quantity || 1,
        price: item.price,
        imageUrl: item.imageUrl
      };
    }

    const existingItemIndex = this.cartItems.findIndex(i => 
      i.merchId === cartItem.merchId && 
      i.size === cartItem.size && 
      (i.isCustom === cartItem.isCustom) &&
      (i.id === cartItem.id)
    );

    if (existingItemIndex !== -1) {
      this.cartItems[existingItemIndex].quantity += cartItem.quantity;
    } else {
      this.cartItems.push(cartItem);
    }

    this.saveCart();
    
    this.cartItems$.next(this.cartItems);
  }

  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter((cartItem) => cartItem !== item);
    this.saveCart();
  }

  clearCart(): void {
    this.cartItems = [];
    this.merchandiseDetails.clear();
    localStorage.removeItem('cartItems');
    this.cartItems$.next(this.cartItems);
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1 || quantity > 100) {
      return;
    }
    item.quantity = quantity;
    this.saveCart();
  }
  
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
          
          this.cartItems.forEach(item => {
            if (item.merchId === merch.id) {
              if (!item.name) {
                item.name = merch.name;
              }
              
              if (merch.images && merch.images.length > 0) {
                const primaryImage = merch.images.find(img => img.isPrimary);
                const imageUrl = primaryImage ? primaryImage.imageUrl : merch.images[0].imageUrl;
                item.imageUrl = imageUrl;
              }
            }
          });
        }
      });
      
      this.saveCart();
    } catch (error) {
      //console.error('[CartService] Failed to fetch merchandise details:', error);
      throw error;
    }
  }

  getTotalPrice(): number {
    const total = this.cartItems.reduce((sum, item) => {
      return sum + Math.round(item.price * item.quantity);
    }, 0);
    return total;
  }

  getMerchandiseDetails(merchandiseId: number): Merchandise | undefined {
    const details = this.merchandiseDetails.get(merchandiseId);
    return details;
  }

  isCartEmpty(): boolean {
    const isEmpty = this.cartItems.length === 0;
    return isEmpty;
  }

  private saveCart(): void {
    if (this.authService.isLoggedIn()) {
      try {
        localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
      } catch (e) {
        //console.error('Error saving cart to localStorage:', e);
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          const cartWithoutImages = this.cartItems.map(item => {
            const copy = {...item};
            if (copy.frontImage) {
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
      this.cartItems$.next(this.cartItems);
    }
  }

  getItemPrice(item: CartItem): number {
    const price = Math.round(item.price * item.quantity);
    return price;
  }

  createOrder(customerName: string, customerEmail: string, customerAddress: string): Observable<any> {
    const orderItems = this.cartItems.map(item => {
      const isCustomItem = (item.id && item.id.toString().startsWith('custom-')) || item.isCustom;
      
      if (isCustomItem) {
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
    
    const order = {
      CustomerName: customerName,
      CustomerEmail: customerEmail,
      CustomerAddress: customerAddress,
      userId: this.authService.getCurrentUserId(),
      Items: orderItems
    };
    
    return this.http.post(`${environment.apiUrl}/api/order/create`, order);
  }

  updateMerchandiseDetails(merchandise: Merchandise): void {
    if (merchandise && merchandise.id) {
      const existingMerch = this.merchandiseDetails.get(merchandise.id);
      if (existingMerch && 
          existingMerch.name === merchandise.name && 
          JSON.stringify(existingMerch.images) === JSON.stringify(merchandise.images)) {
        return;
      }
      
      this.merchandiseDetails.set(merchandise.id, merchandise);
      
      let cartUpdated = false;
      this.cartItems.forEach(item => {
        if (item.merchId === merchandise.id) {
          if (!item.name) {
            item.name = merchandise.name;
            cartUpdated = true;
          }
          
          if (!item.imageUrl && merchandise.images && merchandise.images.length > 0) {
            const primaryImage = merchandise.images.find(img => img.isPrimary);
            item.imageUrl = primaryImage ? primaryImage.imageUrl : merchandise.images[0].imageUrl;
            cartUpdated = true;
          }
        }
      });
      
      if (cartUpdated) {
        this.saveCart();
      }
    }
  }
}