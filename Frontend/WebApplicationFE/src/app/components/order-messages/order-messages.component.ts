import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderMessage, OrderMessageCreate } from '../../models/order-message.model';
import { OrderService } from '../../services/order.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-order-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './order-messages.component.html',
  styleUrls: ['./order-messages.component.css']
})
export class OrderMessagesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() orderId!: number;
  @Input() isAdminMode: boolean = false;
  
  messages: OrderMessage[] = [];
  newMessage: string = '';
  loading: boolean = false;
  error: string | null = null;
  refreshSubscription?: Subscription;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadMessages();
    this.setupAutoRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      this.loadMessages();
      
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
      }
      this.setupAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  setupAutoRefresh(): void {
    this.refreshSubscription = interval(30000)
      .pipe(
        switchMap(() => this.orderService.getOrderMessages(this.orderId))
      )
      .subscribe({
        next: (messages) => {
          this.messages = messages;
        },
        error: () => {
        }
      });
  }

  loadMessages(): void {
    this.loading = true;
    this.error = null;
    this.messages = [];
    
    this.orderService.getOrderMessages(this.orderId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load messages. Please try again.';
        this.loading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }
    
    const messageToSend: OrderMessageCreate = {
      orderId: this.orderId,
      content: this.newMessage.trim(),
      isFromAdmin: this.isAdminMode
    };
    
    this.loading = true;
    
    this.orderService.addOrderMessage(this.orderId, messageToSend).subscribe({
      next: (message) => {
        if (message && message.id) {
          this.messages = [...this.messages, message];
        }
        
        this.newMessage = '';
        this.loading = false;
      },
      error: (err) => {
        alert('Failed to send message. Please try again.');
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
} 