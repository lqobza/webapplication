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
  @Input() isAdminMode: boolean = false; // Default to false, set to true in admin component
  
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
    // If orderId changes, reload messages
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      console.log(`Order ID changed from ${changes['orderId'].previousValue} to ${changes['orderId'].currentValue}`);
      this.loadMessages();
      
      // Reset the auto-refresh with the new orderId
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
    // Set up auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000)
      .pipe(
        switchMap(() => this.orderService.getOrderMessages(this.orderId))
      )
      .subscribe({
        next: (messages) => {
          this.messages = messages;
        },
        error: (err) => {
          console.error('Error refreshing messages:', err);
          // Don't show error on auto-refresh to avoid disrupting the UI
        }
      });
  }

  loadMessages(): void {
    this.loading = true;
    this.error = null;
    this.messages = []; // Clear existing messages while loading
    
    console.log(`Loading messages for order ID: ${this.orderId}`);
    
    this.orderService.getOrderMessages(this.orderId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
        
        // Mark unread messages as read
        this.markUnreadMessagesAsRead();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
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
        console.log('Message sent successfully:', message);
        
        // Add the new message to the messages array
        if (message && message.id) {
          this.messages = [...this.messages, message];
        } else {
          console.error('Received invalid message response:', message);
        }
        
        this.newMessage = '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error sending message:', err);
        alert('Failed to send message. Please try again.');
        this.loading = false;
      }
    });
  }

  markUnreadMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(m => !m.isRead && m.isFromAdmin);
    
    unreadMessages.forEach(message => {
      this.orderService.markMessageAsRead(message.id).subscribe({
        next: () => {
          // Update the message in our local array
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages[index].isRead = true;
          }
        },
        error: (err) => {
          console.error(`Error marking message ${message.id} as read:`, err);
        }
      });
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
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
} 