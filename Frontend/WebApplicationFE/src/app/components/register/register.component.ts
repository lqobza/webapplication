import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule]
})
export class RegisterComponent {
  
  registerForm: FormGroup;
  error: string = '';

  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }

    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['',[
        Validators.required, 
        Validators.email,
        Validators.pattern(this.emailPattern)
      ]],

      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(fg: FormGroup) {
    const password=fg.get('password')?.value;
    const confirmPassword = fg.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      fg.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      fg.get('confirmPassword')?.setErrors(null);
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.error = '';

    const { username, email, password } = this.registerForm.value;

    this.authService.register(username, email, password)
      .subscribe({
        next: () => { 
          this.snackBar.open('Registration successful! Please login with your credentials.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },

        error: error => {
          if (error.status===400) {
            if (error.error && error.error.message === 'User already exists.') {
              this.snackBar.open('An account with this email already exists.', 'Close', {duration: 3000 });
            } else {
              this.snackBar.open(error.error?.message || 'Invalid registration data', 'Close', {duration: 3000 });
            }
          } else {
            this.snackBar.open('Registration failed. Please try again later.', 'Close', {duration: 3000});
          }
        }
      });
  }

  get form() { return this.registerForm.controls; }
} 