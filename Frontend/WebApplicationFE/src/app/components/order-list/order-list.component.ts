import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { OrderDto, OrderStatus } from '../../models/order.model';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RouterModule,
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: OrderDto[] = [];
  error: string | null = null;
  orderStatuses = OrderStatus;
  isAuthenticated = false;

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    
    if (this.isAuthenticated) {
      this.fetchOrders();
    } else {
      this.error = 'You need to be logged in to view your orders'; //snackbarra atirni
    }
  }

  fetchOrders(): void {
    this.error = null;
    
    this.orderService.getUserOrders().subscribe({
      next: (data: OrderDto[]) => {
        this.orders = data || [];
        
        this.orders.forEach(order => {
          if (order.orderItems) {
            order.orderItems.forEach(item => {
              if (!item.merchandise) {
                item.merchandise = {
                  id: item.merchandiseId,
                  name: `Product #${item.merchandiseId}`,
                  primaryImageUrl: ''
                };
              }
              
              if (item.merchandise.primaryImageUrl) {
                item.merchandise.primaryImageUrl = this.getFullImageUrl(item.merchandise.primaryImageUrl);
              }
            });
          }
        });
      },

      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error = 'You need to be logged in to view your orders';  //snackbarra atirni
          this.isAuthenticated = false;
        } else {
          this.error = 'Failed to load orders';
        }
        
        this.orders = [];
      }
    });
  }

  getFullImageUrl(relativeUrl: string | null): string {
    if (!relativeUrl) return '';
    
    if (relativeUrl.startsWith('data:image')) {
      return relativeUrl;
    }
    
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    
    const normalizedUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    
    return `${environment.apiUrl}${normalizedUrl}`;
  }

  getOrderStatusClass(status: string): string {
    let statusClass: string;
    
    switch (status.toLowerCase()) {
      case OrderStatus.Delivered.toLowerCase():
        statusClass = 'status-delivered';
        break;
      case OrderStatus.Processing.toLowerCase():
        statusClass = 'status-processing';
        break;
      case OrderStatus.Shipped.toLowerCase():
        statusClass = 'status-shipped';
        break;
      case OrderStatus.Cancelled.toLowerCase():
        statusClass = 'status-cancelled';
        break;
      case OrderStatus.Created.toLowerCase():
      default:
        statusClass = 'status-created';
        break;
    }
    
    return statusClass;
  }

  formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  }

  confirmCancelOrder(orderId: number): void {
    const dialogRef = this.dialog.open(CancelOrderDialogComponent, {
      width: '350px',
      data: { orderId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.cancelOrder(orderId);
      }
    });
  }

  cancelOrder(orderId: number): void {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = OrderStatus.Cancelled;
        }
      },
      error: (err: HttpErrorResponse) => {
        let errorMessage = 'Failed to cancel order'; //snackbarra atirni
        
        if (err.status === 400) {
          errorMessage = err.error || 'Cannot cancel order';
        } else if (err.status === 404) {
          errorMessage = 'Order not found.';
        }
        
        alert(errorMessage);
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  viewOrderDetails(orderId: number): void {
    this.dialog.open(OrderDetailsComponent, {
      width: '800px',
      data: { orderId: orderId }
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
