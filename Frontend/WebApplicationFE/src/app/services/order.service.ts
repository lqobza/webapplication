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
    return this.http.get<any[]>(`${this.apiUrl}`).pipe(
      map(response => {
        return response.map(order => {
          const orderDto: OrderDto = {
            id: order.id,
            userId: order.userId || '',
            customerName: order.customerName,
            customerEmail: order.customerEmail, 
            customerAddress: order.customerAddress,
            orderDate: order.orderDate,
            totalAmount: order.totalAmount,
            status: order.status,
            orderItems: []
          };
          
          if (order.items && Array.isArray(order.items)){
            orderDto.orderItems = order.items.map((item: any) => ({
              id: item.id,
              orderId: item.orderId,
              merchandiseId: item.merchId,
              merchandise: {
                id: item.merchId,
                name: item.merchandiseName || (item.isCustom ? 'Custom Design' : `Product #${item.merchId}`),
                primaryImageUrl: this.getImageUrlForItem(item)
              },
              size: item.size,
              quantity: item.quantity,
              price: item.price
            }));
          }
          
          return orderDto;

        });
      })
    );
  }


  getOrderById(id: number): Observable<OrderDto> {
    
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`).pipe(
      map(response => {
        const orderDto: OrderDto = {
          id: response.id,
          userId: response.userId || '',
          customerName: response.customerName,
          customerEmail: response.customerEmail,
          customerAddress: response.customerAddress,
          orderDate: response.orderDate,
          totalAmount: response.totalAmount,
          status: response.status,
          orderItems: []
        };
        
        if (response.items && Array.isArray(response.items)) {

          orderDto.orderItems = response.items.map((item: any) => ({
            id: item.id,
            orderId: item.orderId,
            merchandiseId: item.merchId,
            merchandise: {
              id: item.merchId,
              name: item.merchandiseName || (item.isCustom ? 'Custom Design' : `Product #${item.merchId}`),
              primaryImageUrl: this.getImageUrlForItem(item) 
            },
            size: item.size,
            quantity: item.quantity,
            price: item.price
          }));

        }
        
        return orderDto;
      })
    );
  }

  getUserOrders(): Observable<OrderDto[]> {

    return this.http.get<any[]>(`${this.apiUrl}/orders`, { observe: 'response' }).pipe(
      map(response => {
        if (response.status===204) {
          return [];
        }
        
        return (response.body || []).map(order => {
          const orderDto: OrderDto = {
            id: order.id,
            userId: order.userId || '',
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerAddress: order.customerAddress,
            orderDate: order.orderDate,
            totalAmount: order.totalAmount,
            status: order.status,
            orderItems: []
          };
          
          if (order.items && Array.isArray(order.items)) {
            orderDto.orderItems = order.items.map((item: any) => ({
              id: item.id,
              orderId: item.orderId,
              merchandiseId: item.merchId,
              merchandise: {
                id: item.merchId,
                name: item.merchandiseName || (item.isCustom ? 'Custom Design' : `Product #${item.merchId}`),
                primaryImageUrl: this.getImageUrlForItem(item)
              },
              size: item.size,
              quantity: item.quantity,
              price: item.price
            }));
          }
          
          return orderDto;
        });
      })
    );
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
            isFromAdmin: response.isFromAdmin
          };
        })
      );
  }

  private getImageUrlForItem(item: any): string {
    if (item.imageUrl){
      if (item.imageUrl.startsWith('data:image')) {
        return item.imageUrl;
      }
      return item.imageUrl;
    }
    
    if (item.isCustom) {
      return `/uploads/custom/${item.id}.jpg`;
    }
    
    return ''; 
  }
} 
