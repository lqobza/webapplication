import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { MerchandiseListComponent } from './components/merchandise-list/merchandise-list.component';
import { MerchandiseDetailComponent } from './components/merchandise-detail/merchandise-detail.component';
import { MerchandiseCreateComponent } from './components/merchandise-create/merchandise-create.component';
import { MerchandiseUpdateComponent } from './components/merchandise-update/merchandise-update.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CustomDesignPreviewComponent } from './components/custom-design-preview/custom-design-preview.component';
import { CartComponent } from './components/cart/cart.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // ... other routes
];

@NgModule({
  declarations: [
    AppComponent,
    MerchandiseListComponent,
    MerchandiseDetailComponent,
    MerchandiseCreateComponent,
    MerchandiseUpdateComponent,
    NavbarComponent,
    CustomDesignPreviewComponent,
    CartComponent,
    LoginComponent,
    RegisterComponent
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    provideHttpClient(
      withInterceptors([AuthInterceptor])
    )
  ]
})
export class AppModule { }
