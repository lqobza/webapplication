import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomDesignPreviewComponent } from './custom-design-preview.component';

describe('CustomDesignPreviewComponent', () => {
  let component: CustomDesignPreviewComponent;
  let fixture: ComponentFixture<CustomDesignPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomDesignPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomDesignPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
