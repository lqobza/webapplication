import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  loading = true;
  error: string | null = null;
  orderStatuses = OrderStatus;
  displayedColumns: string[] = ['id', 'customerName', 'orderDate', 'totalAmount', 'status', 'actions'];
  updatingOrderId: number | null = null;
  
  public originalStatuses: Map<number, string> = new Map();
  
  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchAllOrders();
  }

  fetchAllOrders(): void {
    this.loading = true;
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
        
        this.loading = false;
      },
      error: (err: any) => {
        if (err.status === 401) {
          this.error = 'You are not authorized to view all orders. Admin access required.';
        } else {
          this.error = 'Failed to load orders. Please try again later.';
        }
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string | Date): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      //console.error('Error formatting date:', error);
      return String(dateString);
    }
  }

  onStatusChange(order: OrderDto, newStatus: string): void {
    const originalStatus = this.originalStatuses.get(order.id) || order.status;
    
    if (originalStatus === newStatus) {
      return;
    }
    
    let warningMessage = '';
    if (originalStatus === 'Delivered' || originalStatus === 'Cancelled') {
      warningMessage = `\n\nWarning: Changing from ${originalStatus} status is unusual and may cause issues.`;
    }
    
    
    const confirmed = confirm(`Are you sure you want to change the order status from ${originalStatus} to ${newStatus}?${warningMessage}`);
    
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
      error: (err: any) => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = this.originalStatuses.get(orderId) || order.status;
        }
        
        alert('Failed to update order status. Please try again later.');
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