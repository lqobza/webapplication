import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) {}

  logout() {
    this.authService.logout();
    this.cartService.clearCart(); // Clear cart on logout
    this.router.navigate(['/']);
  }

  get userEmail(): string {
    const user = this.authService.currentUserValue;
    return user ? user.email : '';
  }
}
