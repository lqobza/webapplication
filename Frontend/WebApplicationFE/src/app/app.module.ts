import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { Routes, provideRouter } from '@angular/router';
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
import { OrderListComponent } from './components/order-list/order-list.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminOrdersComponent } from './components/admin/admin-orders/admin-orders.component';
import { AdminMerchandiseComponent } from './components/admin/admin-merchandise/admin-merchandise.component';
import { MerchandiseFormComponent } from './components/admin/merchandise-form/merchandise-form.component';
import { MyDesignsComponent } from './components/my-designs/my-designs.component';

const routes: Routes = [
  { path: '', component: MerchandiseListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'merchandise', component: MerchandiseListComponent },
  { path: 'merchandise/create', component: MerchandiseCreateComponent },
  { path: 'merchandise/:id', component: MerchandiseDetailComponent },
  { path: 'merchandise/:id/edit', component: MerchandiseUpdateComponent },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrderListComponent, canActivate: [AuthGuard] },
  { path: 'my-designs', component: MyDesignsComponent, canActivate: [AuthGuard] },
  { path: 'custom-design', component: CustomDesignPreviewComponent, canActivate: [AuthGuard] },
  { 
    path: 'admin/orders', 
    component: AdminOrdersComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'admin/merchandise', 
    component: AdminMerchandiseComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'admin/merchandise/create', 
    component: MerchandiseFormComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'admin/merchandise/edit/:id', 
    component: MerchandiseFormComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
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
