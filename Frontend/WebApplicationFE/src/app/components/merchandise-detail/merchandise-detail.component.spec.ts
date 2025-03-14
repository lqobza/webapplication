import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { MerchandiseDetailComponent } from './merchandise-detail.component';
import { MerchandiseService } from '../../services/merchandise.service';
import { RatingService } from '../../services/rating.service';
import { CartService } from '../../services/cart.service';

describe('MerchandiseDetailComponent', () => {
  let component: MerchandiseDetailComponent;
  let fixture: ComponentFixture<MerchandiseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatSnackBarModule,
        MerchandiseDetailComponent
      ],
      providers: [
        MerchandiseService,
        RatingService,
        CartService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: () => '1'
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MerchandiseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
