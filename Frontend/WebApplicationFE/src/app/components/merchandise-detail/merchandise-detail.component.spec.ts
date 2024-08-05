import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchandiseDetailComponent } from './merchandise-detail.component';

describe('MerchandiseDetailComponent', () => {
  let component: MerchandiseDetailComponent;
  let fixture: ComponentFixture<MerchandiseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchandiseDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchandiseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
