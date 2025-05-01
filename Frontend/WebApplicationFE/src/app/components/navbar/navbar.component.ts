import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) {}

  logout() {
    this.authService.logout();
    this.cartService.clearCart();
    this.router.navigate(['/']);
  }

  get userEmail(): string { 
    const user = this.authService.currentUserValue;
    return user ? user.email : '';
  }
  
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  
}
