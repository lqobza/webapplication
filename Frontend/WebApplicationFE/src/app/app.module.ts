import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { Routes, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CustomDesignPreviewComponent } from './components/custom-design-preview/custom-design-preview.component';
import { MerchandiseListComponent } from './components/merchandise-list/merchandise-list.component';
import { MerchandiseDetailComponent } from './components/merchandise-detail/merchandise-detail.component';
import { MerchandiseCreateComponent } from './components/merchandise-create/merchandise-create.component';
import { MerchandiseUpdateComponent } from './components/merchandise-update/merchandise-update.component';
import { CartComponent } from './components/cart/cart.component';

const routes: Routes = [
  { path: '', component: MerchandiseListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'custom-design', component: CustomDesignPreviewComponent },
  { path: 'merchandise', component: MerchandiseListComponent },
  { path: 'merchandise/create', component: MerchandiseCreateComponent },
  { path: 'merchandise/:id', component: MerchandiseDetailComponent },
  { path: 'merchandise/:id/edit', component: MerchandiseUpdateComponent },
  { path: 'cart', component: CartComponent },
  { path: '**', redirectTo: '' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([AuthInterceptor])
    ),
    provideAnimations()
  ]
};
