import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchandiseUpdateComponent } from './merchandise-update.component';

describe('MerchandiseUpdateComponent', () => {
  let component: MerchandiseUpdateComponent;
  let fixture: ComponentFixture<MerchandiseUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchandiseUpdateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchandiseUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
