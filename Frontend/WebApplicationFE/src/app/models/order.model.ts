import { CartItem } from "./cartitem.model";

export enum OrderStatus {
  Created = "Created",
  Processing = "Processing",
  Sent = "Sent",
  Fulfilled = "Fulfilled",
  Cancelled = "Cancelled"
}

export interface OrderDto {
  id: number;
  orderDate: Date;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  status: string;
  items: CartItem[];
}