import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { OrderDto, OrderStatus } from '../../models/order.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    RouterModule
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders: OrderDto[] = [];
  loading = true;
  error: string | null = null;
  orderStatuses = OrderStatus;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    console.log('[OrderList] Component initialized');
  }

  ngOnInit(): void {
    console.log('[OrderList] ngOnInit called');
    this.fetchOrders();
  }

  fetchOrders(): void {
    console.log('[OrderList] Fetching orders');
    this.loading = true;
    const apiUrl = `${environment.apiUrl}/api/order/orders`;
    console.log(`[OrderList] API URL: ${apiUrl}`);
    
    this.http.get<OrderDto[]>(apiUrl)
      .subscribe({
        next: (data) => {
          console.log('[OrderList] Orders fetched successfully:', data);
          this.orders = data;
          
          // Process image URLs to make them absolute
          this.orders.forEach(order => {
            if (order.items) {
              order.items.forEach(item => {
                if (item.imageUrl) {
                  item.imageUrl = this.getFullImageUrl(item.imageUrl);
                }
              });
            }
          });
          
          // Log details about each order for debugging
          this.orders.forEach((order, index) => {
            console.log(`[OrderList] Order #${index + 1} (ID: ${order.id}):`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Date: ${order.orderDate}`);
            console.log(`  Total: ${order.totalAmount}`);
            console.log(`  Items: ${order.items?.length || 0}`);
            
            if (order.items && order.items.length > 0) {
              order.items.forEach((item, itemIndex) => {
                console.log(`  Item #${itemIndex + 1}:`);
                console.log(`    MerchId: ${item.merchId}`);
                console.log(`    Name: ${item.merchandiseName || item.name || 'N/A'}`);
                console.log(`    Size: ${item.size}`);
                console.log(`    Quantity: ${item.quantity}`);
                console.log(`    Price: ${item.price}`);
                console.log(`    Image URL: ${item.imageUrl}`);
              });
            }
          });
          
          this.loading = false;
        },
        error: (err) => {
          console.error('[OrderList] Error fetching orders:', err);
          this.error = 'Failed to load orders. Please try again later.';
          this.loading = false;
        }
      });
  }

  getFullImageUrl(relativeUrl: string | null): string {
    if (!relativeUrl) return '';
    
    // If it's already an absolute URL, return it as is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    
    // Make sure the URL starts with a slash
    const normalizedUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    
    // Combine with the API URL
    console.log(`[OrderList] Converting relative URL ${relativeUrl} to absolute URL ${environment.apiUrl}${normalizedUrl}`);
    return `${environment.apiUrl}${normalizedUrl}`;
  }

  getOrderStatusClass(status: string): string {
    console.log(`[OrderList] Getting status class for: ${status}`);
    let statusClass: string;
    
    switch (status.toLowerCase()) {
      case OrderStatus.Fulfilled.toLowerCase():
        statusClass = 'status-completed';
        break;
      case OrderStatus.Processing.toLowerCase():
        statusClass = 'status-processing';
        break;
      case OrderStatus.Sent.toLowerCase():
        statusClass = 'status-shipped';
        break;
      case OrderStatus.Cancelled.toLowerCase():
        statusClass = 'status-cancelled';
        break;
      case OrderStatus.Created.toLowerCase():
      default:
        statusClass = 'status-pending';
        break;
    }
    
    console.log(`[OrderList] Status class: ${statusClass}`);
    return statusClass;
  }

  formatDate(dateString: string | Date): string {
    console.log(`[OrderList] Formatting date: ${dateString}`);
    try {
      const formatted = new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      console.log(`[OrderList] Formatted date: ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('[OrderList] Error formatting date:', error);
      return String(dateString);
    }
  }

  confirmCancelOrder(orderId: number): void {
    console.log(`[OrderList] Opening confirmation dialog for cancelling order ${orderId}`);
    
    const dialogRef = this.dialog.open(CancelOrderDialogComponent, {
      width: '350px',
      data: { orderId }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`[OrderList] Dialog result: ${result}`);
      if (result === true) {
        this.cancelOrder(orderId);
      }
    });
  }

  cancelOrder(orderId: number): void {
    console.log(`[OrderList] Cancelling order with ID: ${orderId}`);
    const apiUrl = `${environment.apiUrl}/api/order/${orderId}/cancel`;
    console.log(`[OrderList] Cancel API URL: ${apiUrl}`);
    
    this.http.post(apiUrl, {})
      .subscribe({
        next: (response) => {
          console.log(`[OrderList] Order ${orderId} cancelled successfully:`, response);
          // Update the order status in the local array
          const order = this.orders.find(o => o.id === orderId);
          if (order) {
            console.log(`[OrderList] Updating order ${orderId} status to Cancelled`);
            order.status = OrderStatus.Cancelled;
          } else {
            console.log(`[OrderList] Could not find order ${orderId} in local array`);
          }
        },
        error: (err) => {
          console.error(`[OrderList] Error cancelling order ${orderId}:`, err);
          let errorMessage = 'Failed to cancel order. Please try again later.';
          
          if (err.status === 400) {
            errorMessage = err.error || 'Cannot cancel this order in its current state.';
          } else if (err.status === 404) {
            errorMessage = 'Order not found.';
          }
          
          alert(errorMessage);
        }
      });
  }
}

@Component({
  selector: 'app-cancel-order-dialog',
  template: `
    <h2 mat-dialog-title>Cancel Order</h2>
    <mat-dialog-content>
      <p>Are you sure you want to cancel this order?</p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>No, Keep Order</button>
      <button mat-button color="warn" [mat-dialog-close]="true">Yes, Cancel Order</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class CancelOrderDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { orderId: number }) {}
}
