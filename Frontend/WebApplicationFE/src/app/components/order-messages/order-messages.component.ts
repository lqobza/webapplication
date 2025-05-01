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
  error: string | null = null;
  refreshSubscription?: Subscription;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadMessages();
    this.autoRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      this.loadMessages();
      this.autoRefresh();
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  autoRefresh(): void {
    this.refreshSubscription = interval(10000)
      .pipe(
        switchMap(() => this.orderService.getOrderMessages(this.orderId))
      )
      .subscribe({
        next: (messages) => {
          this.messages = messages;
        }
      });
  }

  loadMessages(): void {
    this.error = null;
    this.messages = [];
    
    this.orderService.getOrderMessages(this.orderId).subscribe({
      next: (messages) => {
        this.messages = messages;
      },
      error: () => {
        this.error = 'Failed to load messages';  //snackbarra atirni
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
    
    
    this.orderService.addOrderMessage(this.orderId, messageToSend).subscribe({
      next: (message) => {
        if (message && message.id) {
          this.messages = [...this.messages, message];
        }
        
        this.newMessage = '';
      },
      error: () => {
        alert('Failed to send message'); //snackbarra atirni
      }
    });
  }

  formatDate(dateString: string): string {
    return  new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'});

  }
} 