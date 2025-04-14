import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminMerchandiseComponent } from './admin-merchandise.component';
import { MerchandiseService } from '../../../services/merchandise.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { PaginatedResponse } from '../../../models/paginated-response.model';
import { Merchandise } from '../../../models/merchandise.model';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

describe('AdminMerchandiseComponent', () => {
  let component: AdminMerchandiseComponent;
  let fixture: ComponentFixture<AdminMerchandiseComponent>;
  let merchandiseServiceMock: jasmine.SpyObj<MerchandiseService>;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let activatedRouteMock: any;
  let routerMock: jasmine.SpyObj<Router>;

  const mockMerchandise: PaginatedResponse<Merchandise> = {
    items: [
      {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        categoryId: 1,
        images: [
          {
            id: 1,
            merchId: 1,
            imageUrl: '/images/test.jpg',
            isPrimary: true
          }
        ],
        sizes: [
          {
            id: 1,
            merchId: 1,
            size: 'M',
            inStock: 10
          }
        ]
      }
    ],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };

  beforeEach(async () => {
    merchandiseServiceMock = jasmine.createSpyObj('MerchandiseService', ['getAllMerchandise', 'deleteMerchandise', 'getCategories']);
    dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    activatedRouteMock = {
      snapshot: {
        queryParams: {}
      }
    };
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    merchandiseServiceMock.getAllMerchandise.and.returnValue(of(mockMerchandise));
    merchandiseServiceMock.deleteMerchandise.and.returnValue(of({}));
    merchandiseServiceMock.getCategories.and.returnValue(of([]));

    spyOn(window, 'alert');

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        AdminMerchandiseComponent
      ],
      providers: [
        { provide: MerchandiseService, useValue: merchandiseServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMerchandiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load merchandise on init', () => {
    expect(merchandiseServiceMock.getAllMerchandise).toHaveBeenCalled();
    expect(component.merchandiseList).toEqual(mockMerchandise.items);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading merchandise', () => {
    merchandiseServiceMock.getAllMerchandise.and.returnValue(throwError(() => new Error('Server error')));
    
    component.fetchMerchandise();
    
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should delete merchandise', () => {
    const itemId = 1;
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteMerchandise(itemId);
    
    expect(merchandiseServiceMock.deleteMerchandise).toHaveBeenCalledWith(itemId);
  });

  it('should not delete merchandise if user cancels', () => {
    const itemId = 1;
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteMerchandise(itemId);
    
    expect(merchandiseServiceMock.deleteMerchandise).not.toHaveBeenCalled();
  });

  it('should handle error when deleting merchandise', () => {
    const itemId = 1;
    spyOn(window, 'confirm').and.returnValue(true);
    merchandiseServiceMock.deleteMerchandise.and.returnValue(throwError(() => new Error('Server error')));
    
    component.deleteMerchandise(itemId);
    
    expect(window.alert).toHaveBeenCalledWith('Failed to delete merchandise. Please try again later.');
  });

  it('should handle page event', () => {
    const event = { pageIndex: 1, pageSize: 20 } as PageEvent;
    component.handlePageEvent(event);
    
    expect(component.pageSize).toBe(20);
    expect(component.pageIndex).toBe(1);
    expect(merchandiseServiceMock.getAllMerchandise).toHaveBeenCalledWith(2, 20);
  });

  it('should get category name', () => {
    component.categoryMap.set(1, 'Test Category');
    expect(component.getCategoryName(1)).toBe('Test Category');
    expect(component.getCategoryName(undefined)).toBe('Unknown');
    expect(component.getCategoryName(999)).toBe('Unknown');
  });
}); 