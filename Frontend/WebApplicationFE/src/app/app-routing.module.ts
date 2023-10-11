import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonComponent } from './person/person.component';

const routes: Routes = [
  {
    path: 'person',
    children:[{path: '**', component: PersonComponent}],
    //canActivate: [RouterGuardService],
    //data: [Guard.HAS_ACCESS_TOKEN],
    //runGuardAndResolvers: 'always'
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
