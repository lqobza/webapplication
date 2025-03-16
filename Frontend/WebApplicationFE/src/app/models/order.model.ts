export enum OrderStatus {
  Created = 'Created',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface OrderDto {
  id: number;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  orderItems: OrderItemDto[];
}

export interface OrderItemDto {
  id: number;
  orderId: number;
  merchandiseId: number;
  merchandise: {
    id: number;
    name: string;
    primaryImageUrl: string;
  };
  size: string;
  quantity: number;
  price: number;
}