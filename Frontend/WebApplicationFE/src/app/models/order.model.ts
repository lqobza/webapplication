import { CartItem } from "./cartitem.model";

export interface OrderDto {
    id: number;
    orderDate: Date;
    totalAmount: number;
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    items: CartItem[]; // Ensure this matches the backend
  }