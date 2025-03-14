export interface OrderMessage {
  id: number;
  orderId: number;
  content: string;
  timestamp: string;
  isFromAdmin: boolean;
  isRead: boolean;
}

export interface OrderMessageCreate {
  orderId: number;
  content: string;
  isFromAdmin: boolean;
} 