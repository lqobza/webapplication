import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { OrderDto, OrderStatus } from '../../../models/order.model';
import { MatExpansionModule } from '@angular/material/expansion';
import { OrderMessagesComponent } from '../../order-messages/order-messages.component';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatDialogModule,
    RouterModule,
    MatExpansionModule,
    OrderMessagesComponent
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
  expandedOrderId: number | null = null;
  updatingOrderId: number | null = null; // Track which order is being updated
  
  // Store original status values to detect changes
  private originalStatuses: Map<number, string> = new Map();
  
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
        console.log('Admin: Orders fetched successfully:', data);
        this.orders = data || [];
        
        // Store original status values
        this.orders.forEach(order => {
          this.originalStatuses.set(order.id, order.status);
        });
        
        // Process image URLs if needed
        this.orders.forEach(order => {
          if (order.orderItems) {
            order.orderItems.forEach(item => {
              if (item.merchandise && item.merchandise.primaryImageUrl) {
                // Make sure image URLs are absolute
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
        console.error('Admin: Error fetching orders:', err);
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
      console.error('Error formatting date:', error);
      return String(dateString);
    }
  }

  onStatusChange(order: OrderDto, newStatus: string): void {
    const originalStatus = this.originalStatuses.get(order.id) || order.status;
    
    // If status hasn't changed, do nothing
    if (originalStatus === newStatus) {
      return;
    }
    
    // Create warning message if needed
    let warningMessage = '';
    if (originalStatus === 'Delivered' || originalStatus === 'Cancelled') {
      warningMessage = `\n\nWarning: Changing from ${originalStatus} status is unusual and may cause issues.`;
    }
    
    // Use simple confirm dialog
    const confirmed = confirm(`Are you sure you want to change the order status from ${originalStatus} to ${newStatus}?${warningMessage}`);
    
    if (confirmed) {
      // User confirmed, update the status
      this.updateOrderStatus(order.id, newStatus);
    } else {
      // User cancelled, revert the select to original value
      console.log(`User cancelled status change, reverting to ${originalStatus}`);
      
      // We need to use setTimeout to ensure this happens after the current event cycle
      setTimeout(() => {
        order.status = originalStatus;
      });
    }
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    this.updatingOrderId = orderId;
    
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        console.log(`Successfully updated order ${orderId} status to ${newStatus}`);
        
        // Update the order status in the local array and original statuses map
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
          this.originalStatuses.set(orderId, newStatus);
        }
        
        this.updatingOrderId = null;
      },
      error: (err: any) => {
        console.error(`Error updating order ${orderId} status:`, err);
        
        // Revert to original status in the UI
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = this.originalStatuses.get(orderId) || order.status;
        }
        
        alert('Failed to update order status. Please try again later.');
        this.updatingOrderId = null;
      }
    });
  }

  toggleOrderMessages(orderId: number): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }
} 