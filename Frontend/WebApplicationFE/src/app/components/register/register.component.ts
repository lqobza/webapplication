import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  loading: boolean = false;

  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }

    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
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
    const password = fg.get('password')?.value;
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

    this.loading = true;
    this.error = '';

    const { username, email, password } = this.registerForm.value;

    this.authService.register(username, email, password)
      .subscribe({
        next: () => {
          this.authService.login(username, password)
            .subscribe({
              next: () => {
                this.router.navigate(['/']);
              },
              error: error => {
                this.error = 'Registration successful but login failed';
                this.loading = false;
              }
            });
        },
        error: error => {
          this.error = error.error?.message || 'Registration failed';
          this.loading = false;
        }
      });
  }

  get f() { return this.registerForm.controls; }
} 