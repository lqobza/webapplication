import { Component, Input, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrderService } from '../../services/order.service';
import { OrderDto, OrderStatus } from '../../models/order.model';
import { OrderMessagesComponent } from '../order-messages/order-messages.component';
import { environment } from '../../../environments/environment';

interface DialogData {
  orderId: number;
  isAdminMode?: boolean;
}

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    OrderMessagesComponent
  ],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.css']
})
export class OrderDetailsComponent implements OnInit {
  @Input() orderId!: number;
  @Input() isAdminMode: boolean = false;

  order: OrderDto | null = null;
  error: string | null = null;
  apiUrl = environment.apiUrl;
  orderStatuses = OrderStatus;

  constructor(
    private orderService: OrderService,
    @Optional() public dialogRef: MatDialogRef<OrderDetailsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: DialogData
  ) {
    if (this.dialogData) {
      this.orderId = this.dialogData.orderId;
      this.isAdminMode = this.dialogData.isAdminMode || false;
    }
  }

  ngOnInit(): void {
    this.fetchOrderDetails();
  }

  fetchOrderDetails(): void {
    if (!this.orderId) {
      this.error='orderId is required';
      return;
    }

    this.error = null;

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {

        this.order = order;
        
        if (this.order && this.order.orderItems) {
          
          this.order.orderItems.forEach((item, index) => {
            if (!item.merchandise) {
              item.merchandise = {
                id: item.merchandiseId,
                name: `Product #${item.merchandiseId}`,
                primaryImageUrl: ''
              };
            }
          });
        }

      },
      error: () => {
        this.error = 'Failed to load order details'; //snackbarra atirni
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getOrderStatusClass(status: string): string {
    switch (status) {
      case OrderStatus.Created:
        return 'status-created';
      case OrderStatus.Processing:
        return 'status-processing';
      case OrderStatus.Shipped:
        return 'status-shipped';
      case OrderStatus.Delivered:
        return 'status-delivered';
      case OrderStatus.Cancelled:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      return '/assets/images/placeholder.png';
    }
    
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    if (imageUrl.includes('null.jpg')) {
      return '/assets/images/placeholder.png';
    }
    
    return `${this.apiUrl}${imageUrl}`;
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
