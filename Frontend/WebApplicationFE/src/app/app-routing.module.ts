import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { MerchandiseListComponent } from './components/merchandise-list/merchandise-list.component';
import { MerchandiseDetailComponent } from './components/merchandise-detail/merchandise-detail.component';
import { MerchandiseCreateComponent } from './components/merchandise-create/merchandise-create.component';
import { MerchandiseUpdateComponent } from './components/merchandise-update/merchandise-update.component';
import { CustomDesignPreviewComponent } from './components/custom-design-preview/custom-design-preview.component';
import { CartComponent } from './components/cart/cart.component';

const routes: Routes = [
  { path: '', redirectTo: '/merchandise', pathMatch: 'full' },
  { path: 'merchandise', component: MerchandiseListComponent },
  { path: 'merchandise/:id', component: MerchandiseDetailComponent },
  { path: 'create', component: MerchandiseCreateComponent },
  { path: 'update/:id', component: MerchandiseUpdateComponent },
  { path: 'render-image-test', component: CustomDesignPreviewComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'cart', 
    component: CartComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
