import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderDto } from '../models/order.model';
import { OrderMessage, OrderMessageCreate } from '../models/order-message.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/order`;

  constructor(private http: HttpClient) { }

  getApiUrl(): string {
    return environment.apiUrl;
  }

  getAllOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiUrl}`);
  }

  getOrderById(id: number): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/orders/${id}`);
  }

  getUserOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiUrl}/orders`);
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/cancel`, {});
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/status`, { status });
  }

  getOrderMessages(orderId: number): Observable<OrderMessage[]> {
    return this.http.get<OrderMessage[]>(`${this.apiUrl}/${orderId}/messages`);
  }

  addOrderMessage(orderId: number, messageData: OrderMessageCreate): Observable<OrderMessage> {
    return this.http.post<OrderMessage>(`${this.apiUrl}/${orderId}/messages`, messageData)
      .pipe(
        map(response => {
          return {
            id: response.id,
            orderId: response.orderId || orderId,
            content: response.content,
            timestamp: response.timestamp || new Date().toISOString(),
            isFromAdmin: response.isFromAdmin,
            isRead: response.isRead || false
          };
        })
      );
  }

  markMessageAsRead(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {});
  }
} 