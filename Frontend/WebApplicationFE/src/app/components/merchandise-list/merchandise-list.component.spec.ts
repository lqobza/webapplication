import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchandiseListComponent } from './merchandise-list.component';

describe('MerchandiseListComponent', () => {
  let component: MerchandiseListComponent;
  let fixture: ComponentFixture<MerchandiseListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MerchandiseListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchandiseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
