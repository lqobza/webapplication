import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MerchandiseListComponent } from './merchandise-list.component';
import { MerchandiseService } from '../../services/merchandise.service';
import { of } from 'rxjs';

describe('MerchandiseListComponent', () => {
  let component: MerchandiseListComponent;
  let fixture: ComponentFixture<MerchandiseListComponent>;
  let merchandiseService: jasmine.SpyObj<MerchandiseService>;

  beforeEach(async () => {
    const merchandiseServiceSpy = jasmine.createSpyObj('MerchandiseService', ['getAllMerchandise']);
    
    await TestBed.configureTestingModule({
      imports: [ MerchandiseListComponent, FormsModule ],
      providers: [
        { provide: MerchandiseService, useValue: merchandiseServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchandiseListComponent);
    component = fixture.componentInstance;
    merchandiseService = TestBed.inject(MerchandiseService) as jasmine.SpyObj<MerchandiseService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter merchandise based on search term', () => {
    component.merchandiseList = [
      { id: 1, name: 'Item One', description: 'Description One', price: 10, categoryId: 1, categoryName: 'Category A' },
      { id: 2, name: 'Item Two', description: 'Description Two', price: 20, categoryId: 1, categoryName: 'Category A' },
      { id: 3, name: 'Another Item', description: 'Description Three', price: 30, categoryId: 2, categoryName: 'Category B' }
    ];
    component.filteredList = [...component.merchandiseList];
    component.searchTerm = 'Item';
    component.applySearch();
    
    expect(component.filteredList.length).toBe(2); // Should match 'Item One' and 'Item Two'
    
    component.searchTerm = 'Another';
    component.applySearch();
    
    expect(component.filteredList.length).toBe(1); // Should match 'Another Item'
    
    component.searchTerm = 'Non-existent';
    component.applySearch();
    
    expect(component.filteredList.length).toBe(0); // No matches
  });
});
