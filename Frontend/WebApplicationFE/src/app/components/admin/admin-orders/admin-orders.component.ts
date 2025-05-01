import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OrderDto, OrderStatus } from '../../../models/order.model';
import { OrderService } from '../../../services/order.service';
import { OrderDetailsComponent } from '../../order-details/order-details.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: OrderDto[] = [];
  error: string | null = null;
  orderStatuses = OrderStatus;
  displayedColumns: string[] = ['id', 'customerName', 'orderDate', 'totalAmount', 'status', 'actions'];
  updatingOrderId: number | null = null;
  
  public originalStatuses: Map<number, string> = new Map();
  
  constructor(
    private orderService: OrderService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchAllOrders();
  }

  fetchAllOrders(): void {
    this.error = null;
    
    this.orderService.getAllOrders().subscribe({
      next: (data: OrderDto[]) => {
        this.orders = data || [];
        
        this.orders.forEach(order => {
          this.originalStatuses.set(order.id, order.status);
        });
        
        this.orders.forEach(order => {
          if (order.orderItems) {
            order.orderItems.forEach(item => {
              if (item.merchandise && item.merchandise.primaryImageUrl) {
                if (!item.merchandise.primaryImageUrl.startsWith('http')) {
                  item.merchandise.primaryImageUrl = `${this.orderService.getApiUrl()}${item.merchandise.primaryImageUrl}`;
                }

              }
            });
          }
        });
      },
      error: (err: any) => {    //snackbarra atirni
        if (err.status === 401) {
          this.error = 'You are not authorized to view all orders. Admin access required.';    
        } else {
          this.error = 'Failed to load orders';
        }
      }
    });
  }

  formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onStatusChange(order: OrderDto, newStatus: string): void {
    const originalStatus = this.originalStatuses.get(order.id) || order.status;
    
    if (originalStatus === newStatus) {
      return;
    }
    
    const confirmed = confirm(`Are you sure you  want to change the order status from ${originalStatus} to ${newStatus}?`);
    
    if (confirmed) {
      this.updateOrderStatus(order.id, newStatus);
    } else {
      setTimeout(() => {
        order.status = originalStatus;
      });
    }
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    this.updatingOrderId = orderId;
    
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
          this.originalStatuses.set(orderId, newStatus);
        }
        
        this.updatingOrderId = null;
      },
      error: () => {    //snackbarra lehetne jelezni
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = this.originalStatuses.get(orderId) || order.status;
        }
        this.updatingOrderId = null;
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    this.dialog.open(OrderDetailsComponent, {
      width: '800px',
      data: { orderId: orderId, isAdminMode: true }
    });
  }
} 