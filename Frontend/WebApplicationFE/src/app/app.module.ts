import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { MerchandiseListComponent } from './components/merchandise-list/merchandise-list.component';
import { MerchandiseDetailComponent } from './components/merchandise-detail/merchandise-detail.component';
import { MerchandiseCreateComponent } from './components/merchandise-create/merchandise-create.component';
import { MerchandiseUpdateComponent } from './components/merchandise-update/merchandise-update.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CustomDesignPreviewComponent } from './components/custom-design-preview/custom-design-preview.component';

@NgModule({
  declarations: [
    AppComponent,
    MerchandiseListComponent,
    MerchandiseDetailComponent,
    MerchandiseCreateComponent,
    MerchandiseUpdateComponent,
    NavbarComponent,
    CustomDesignPreviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
