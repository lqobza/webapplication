import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartitem.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Customer details for the order
  customerName: string = '';
  customerEmail: string = '';
  customerAddress: string = '';

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.getCartItems().subscribe({
      next: (items: CartItem[]) => {
        this.cartItems = items; // Assign the emitted array to cartItems
        this.updateTotalPrice(); // Update total price after loading items
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cart items. Please try again later.';
        this.isLoading = false;
      },
    });

    // Listen for changes to the cart items
    this.cartService.getCartItems().subscribe((items) => {
      this.cartItems = items;
      this.updateTotalPrice(); // Update total price whenever cart items change
    });
  }

  /**
   * Get the image URL for a cart item.
   */
  getImageUrl(item: CartItem): string {
    const merch = this.cartService.getMerchandiseDetails(item.merchandiseId);
    return merch?.imageUrl || 'assets/default-image.png'; // Fallback image
  }

  /**
   * Get the total price for a cart item.
   */
  getItemPrice(item: CartItem): number {
    const merch = this.cartService.getMerchandiseDetails(item.merchandiseId);
    return merch ? merch.price * item.quantity : 0;
  }

  /**
   * Remove an item from the cart.
   */
  removeItem(item: CartItem): void {
    this.cartService.removeItem(item);
  }

  /**
   * Clear the entire cart.
   */
  clearCart(): void {
    this.cartService.clearCart();
  }

  /**
   * Update the quantity of a cart item.
   */
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