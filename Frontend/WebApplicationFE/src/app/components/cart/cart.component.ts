import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartitem.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  // Customer details for the order
  customerName: string = '';
  customerEmail: string = '';
  customerAddress: string = '';

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.cartService.getCartItems().subscribe({
      next: (items: CartItem[]) => {
        this.cartItems = items;
        this.updateTotalPrice();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cart items. Please try again later.';
        this.isLoading = false;
        console.error('Error loading cart:', error);
      },
    });
  }

  getImageUrl(item: CartItem): string {
    const merch = this.cartService.getMerchandiseDetails(item.merchandiseId);
    return merch?.imageUrl || 'assets/default-image.png'; // Fallback image
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