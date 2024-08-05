import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MerchandiseListComponent } from './components/merchandise-list/merchandise-list.component';
import { MerchandiseDetailComponent } from './components/merchandise-detail/merchandise-detail.component';
import { MerchandiseCreateComponent } from './components/merchandise-create/merchandise-create.component';
import { MerchandiseUpdateComponent } from './components/merchandise-update/merchandise-update.component';

const routes: Routes = [
  { path: '', redirectTo: '/merchandise', pathMatch: 'full' },
  { path: 'merchandise', component: MerchandiseListComponent },
  { path: 'merchandise/:id', component: MerchandiseDetailComponent },
  { path: 'create', component: MerchandiseCreateComponent },
  { path: 'update/:id', component: MerchandiseUpdateComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
