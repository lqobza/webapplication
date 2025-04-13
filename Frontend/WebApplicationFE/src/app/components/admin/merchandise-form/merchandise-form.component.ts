import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MerchandiseService } from '../../../services/merchandise.service';
import { Category } from '../../../models/category.model';
import { environment } from 'src/environments/environment';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-merchandise-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './merchandise-form.component.html',
  styleUrls: ['./merchandise-form.component.css']
})
export class MerchandiseFormComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  merchandiseForm: FormGroup;
  isEditMode = false;
  merchandiseId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  categories: Category[] = [];
  brands: any[] = [];
  availableSizes: string[] = [];
  uploadProgress: number = 0;
  isUploading: boolean = false;
  loadingSizes: boolean = false;
  
  readonly ACCESSORY_CATEGORY_ID = 5;
  
  constructor(
    private fb: FormBuilder,
    private merchandiseService: MerchandiseService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.merchandiseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      categoryId: ['', Validators.required],
      brandId: [0, Validators.required],
      sizes: this.fb.array([]),
      images: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.merchandiseId = +params['id'];
        this.loadMerchandise(this.merchandiseId);
      } else {
        this.addSize();
        this.merchandiseForm.setControl('images', this.fb.array([]));
      }
    });
    
    this.merchandiseForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId) {
        if (!this.loading) {
          this.loadSizesForCategory(categoryId);
          
          this.handleCategoryChange(categoryId);
          
          this.updateSizeControlsState(categoryId);
        } else {
          this.loadSizesForCategory(categoryId);
        }
      } else {
        this.availableSizes = [];
      }
    });
  }

  loadBrands(): void {
    this.merchandiseService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (err) => {
        this.snackBar.open('Failed to load brands', 'Close', { duration: 3000 });
      }
    });
  }

  updateSizeControlsState(categoryId: number): void {
    const isAccessory = categoryId === this.ACCESSORY_CATEGORY_ID;
    
    for (let i = 0; i < this.sizesArray.length; i++) {
      const sizeControl = this.sizesArray.at(i).get('size');
      if (isAccessory) {
        sizeControl?.disable();
      } else {
        sizeControl?.enable();
      }
    }
  }

  handleCategoryChange(categoryId: number): void {
    if (categoryId === this.ACCESSORY_CATEGORY_ID) {
      const hasOneSizeAlready = this.sizesArray.controls.some(
        control => control.get('size')?.value === 'One Size'
      );
      
      if (!hasOneSizeAlready) {
        while (this.sizesArray.length) {
          this.sizesArray.removeAt(0);
        }
        
        const sizeGroup = this.fb.group({
          size: [{value: 'One Size', disabled: true}, Validators.required],
          inStock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
        });
        this.sizesArray.push(sizeGroup);
      } else {
        const oneSizeIndex = this.sizesArray.controls.findIndex(
          control => control.get('size')?.value === 'One Size'
        );
        
        for (let i = this.sizesArray.length - 1; i >= 0; i--) {
          if (i !== oneSizeIndex) {
            this.sizesArray.removeAt(i);
          }
        }
        
        this.sizesArray.at(0).get('size')?.disable();
      }
    }

    else if (this.sizesArray.length === 1 && 
             this.sizesArray.at(0).get('size')?.value === 'One Size') {
      this.sizesArray.removeAt(0);
      this.addSize();
    }
  }

  loadCategories(): void {
    this.merchandiseService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
  }

  loadSizesForCategory(categoryId: number): void {
    this.loadingSizes = true;
    this.availableSizes = [];
    
    if (categoryId === this.ACCESSORY_CATEGORY_ID) {
      this.availableSizes = ['One Size'];
      this.loadingSizes = false;
      return;
    }
    
    this.merchandiseService.getSizes(categoryId).subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          if (response.length > 0 && typeof response[0] === 'object') {
            this.availableSizes = response.map((item: any) => item.size || item.name || item.toString());
          } else {
            this.availableSizes = response.map((item: any) => item.toString());
          }
        } else if (typeof response === 'object' && response !== null) {
          const items: any[] = (response as any).items || (response as any).sizes || [];
          this.availableSizes = items.map((item: any) => 
            typeof item === 'object' ? (item.size || item.name || item.toString()) : item.toString()
          );
        } else {
          this.availableSizes = [];
        }
        
        if (this.availableSizes.length === 0) {
          this.useDefaultSizes(categoryId);
          this.snackBar.open('Using default sizes for this category', 'Close', { duration: 3000 });
        }
        
        this.loadingSizes = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load sizes, using defaults', 'Close', { duration: 3000 });
        this.useDefaultSizes(categoryId);
        this.loadingSizes = false;
      }
    });
  }
  
  useDefaultSizes(categoryId: number): void {
    const defaultSizes: { [key: number]: string[] } = {
      1: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      2: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      3: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      4: ['28', '30', '32', '34', '36', '38', '40'],
      5: ['One Size'],
      6: ['EU36', 'EU37', 'EU38', 'EU39', 'EU40', 'EU41', 'EU42', 'EU43', 'EU44', 'EU45', 'EU46']
    };
    
    this.availableSizes = defaultSizes[categoryId] || ['S', 'M', 'L', 'XL'];
  }

  get sizesArray(): FormArray {
    return this.merchandiseForm.get('sizes') as FormArray;
  }

  get imagesArray(): FormArray {
    return this.merchandiseForm.get('images') as FormArray;
  }

  getSelectedSizes(): string[] {
    return this.sizesArray.controls
      .map(control => control.get('size')?.value)
      .filter(size => size !== null && size !== undefined && size !== '');
  }

  getAvailableSizesForSelection(currentIndex: number): string[] {
    const currentlySelectedSizes = this.getSelectedSizes();
    const currentSize = this.sizesArray.at(currentIndex).get('size')?.value;
    
    if (this.merchandiseForm.get('categoryId')?.value === this.ACCESSORY_CATEGORY_ID) {
      return ['One Size'];
    }
    
    return this.availableSizes.filter(size => 
      size === currentSize || !currentlySelectedSizes.includes(size)
    );
  }

  addSize(): void {
    if (this.merchandiseForm.get('categoryId')?.value === this.ACCESSORY_CATEGORY_ID) {
      this.snackBar.open('Accessories can only have one size', 'Close', { duration: 3000 });
      return;
    }
    
    const selectedSizes = this.getSelectedSizes();
    
    const availableSize = this.availableSizes.find(size => !selectedSizes.includes(size));
    
    if (!availableSize && this.availableSizes.length > 0) {
      this.snackBar.open('All available sizes have been added', 'Close', { duration: 3000 });
      return;
    }
    
    const sizeGroup = this.fb.group({
      size: [availableSize || '', Validators.required],
      inStock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
    });
    
    this.sizesArray.push(sizeGroup);
  }

  removeSize(index: number): void {
    if (this.merchandiseForm.get('categoryId')?.value === this.ACCESSORY_CATEGORY_ID && this.sizesArray.length <= 1) {
      this.snackBar.open('Accessories must have one size', 'Close', { duration: 3000 });
      return;
    }
    
    if (this.sizesArray.length <= 1) {
      this.snackBar.open('At least one size is required', 'Close', { duration: 3000 });
      return;
    }
    
    this.sizesArray.removeAt(index);
  }

  addImage(): void {
    this.imagesArray.push(this.fb.group({
      imageUrl: ['', Validators.required],
      isPrimary: [this.imagesArray.length === 0]
    }));
  }

  removeImage(index: number): void {
    let imageNameArr = this.imagesArray.at(index).get('imageUrl')?.value.split('/');

    this.merchandiseService.deleteImage(this.merchandiseId!, imageNameArr[imageNameArr.length-1]).subscribe({
      next: () => {
        this.snackBar.open('Image deleted successfully', 'Close', { duration: 3000 });
        this.imagesArray.removeAt(index);
    
        if (this.imagesArray.length === 0 && !this.isEditMode) {
          return;
        }
        
        if (this.imagesArray.length > 0 && !this.imagesArray.controls.some(control => control.get('isPrimary')?.value)) {
          this.imagesArray.at(0).get('isPrimary')?.setValue(true);
        }
      }
    });
  }

  setPrimaryImage(index: number): void {
    for (let i = 0; i < this.imagesArray.length; i++) {
      this.imagesArray.at(i).get('isPrimary')?.setValue(i === index);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadImage(file);
    }
  }

  uploadImage(file: File): void {
    if (!this.merchandiseId) {
      this.snackBar.open('Please save the merchandise first before uploading images', 'Close', { duration: 5000 });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 300);

    this.merchandiseService.uploadImage(this.merchandiseId, file)
      .pipe(
        finalize(() => {
          clearInterval(progressInterval);
          this.isUploading = false;
          this.uploadProgress = 100;
          setTimeout(() => this.uploadProgress = 0, 1000);
        })
      )
      .subscribe({
        next: (response) => {
          const imageControl = this.fb.group({
            imageUrl: [response.imageUrl, Validators.required],
            isPrimary: [this.imagesArray.length === 0]
          });
          this.imagesArray.push(imageControl);
          
          this.snackBar.open('Image uploaded successfully', 'Close', { duration: 3000 });
          
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
        },
        error: (err) => {
          this.snackBar.open('Failed to upload image', 'Close', { duration: 3000 });
        }
      });
  }

  getImagePreview(imageUrl: string): string {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('/')) {
      return `${environment.apiUrl}${imageUrl}`;
    }
    
    return imageUrl;
  }

  getBrandName(brandId: number): string {
    if (!brandId || brandId === 0) return 'No Brand';
    
    const brand = this.brands.find(b => b.id === brandId);
    return brand ? brand.name : 'Unknown Brand';
  }

  getCategoryName(categoryId: number): string {
    if (!categoryId) return 'No Category';
    
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  loadMerchandise(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.merchandiseService.getMerchandiseById(id).subscribe({
      next: (merchandise) => {
        while (this.sizesArray.length) {
          this.sizesArray.removeAt(0);
        }
        while (this.imagesArray.length) {
          this.imagesArray.removeAt(0);
        }

        this.merchandiseForm.patchValue({
          name: merchandise.name,
          description: merchandise.description,
          price: Math.round(merchandise.price),
          categoryId: merchandise.categoryId,
          brandId: merchandise.brandId || 0
        });

        this.merchandiseForm.get('name')?.disable();
        this.merchandiseForm.get('brandId')?.disable();
        this.merchandiseForm.get('categoryId')?.disable();

        if (merchandise.categoryId) {
          this.loadSizesForCategory(merchandise.categoryId);
        }

        if (merchandise.sizes && merchandise.sizes.length > 0) {
          if (merchandise.categoryId === this.ACCESSORY_CATEGORY_ID) {
            const accessorySize = merchandise.sizes.find(s => s.size === 'One Size') || merchandise.sizes[0];
            
            const sizeGroup = this.fb.group({
              size: [{
                value: 'One Size', 
                disabled: true
              }, Validators.required],
              inStock: [accessorySize.inStock, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
            });
            
            this.sizesArray.push(sizeGroup);
          } else {
            merchandise.sizes.forEach(size => {
              const sizeGroup = this.fb.group({
                size: [size.size, Validators.required],
                inStock: [size.inStock, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
              });
              this.sizesArray.push(sizeGroup);
            });
          }
        } else {
          this.addSize();
        }

        this.merchandiseService.getMerchandiseImages(id).subscribe({
          next: (images) => {
            if (images && images.length > 0) {
              images.forEach(image => {
                this.imagesArray.push(this.fb.group({
                  imageUrl: [image.imageUrl, Validators.required],
                  isPrimary: [image.isPrimary]
                }));
              });
            }
          },
          error: (err) => {
            if (err.status === 404) {
            } else {
              this.snackBar.open('Could not load images. You can add new ones.', 'Close', { duration: 3000 });
            }
          }
        });

        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load merchandise. Please try again later.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.merchandiseForm.invalid) {
      this.merchandiseForm.markAllAsTouched();
      //console.error('Form is invalid:', this.merchandiseForm.errors);
      
      Object.keys(this.merchandiseForm.controls).forEach(key => {
        const control = this.merchandiseForm.get(key);
        if (control && control.invalid) {
          //console.error(`Control '${key}' is invalid:`, control.errors);
        }
      });
      return;
    }

    this.submitting = true;
    const formData = { ...this.merchandiseForm.value };
    
    formData.price = Math.round(formData.price);
    
    if (!this.isEditMode) {
      formData.images = [];
    }
    
    else if (formData.images.length > 0 && !formData.images.some((img: any) => img.isPrimary)) {
      formData.images[0].isPrimary = true;
    }

    if (!this.isEditMode && !formData.themeIds) {
      formData.themeIds = [];
    }

    if (formData.categoryId === this.ACCESSORY_CATEGORY_ID) {
      formData.sizes = formData.sizes.map((size: any) => ({
        ...size,
        size: 'One Size'
      }));
    }

    const rawSizes = this.sizesArray.controls.map(control => {
      const rawValue = control.getRawValue();
      return {
        size: rawValue.size,
        inStock: rawValue.inStock
      };
    });
    
    formData.sizes = rawSizes;

    if (this.isEditMode && this.merchandiseId) {
      const updateData = {
        id: this.merchandiseId,
        description: formData.description,
        price: formData.price,
        sizes: formData.sizes,
      };

      this.merchandiseService.updateMerchandise(this.merchandiseId, updateData).subscribe({
        next: () => {
          this.snackBar.open('Merchandise updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/merchandise']);
        },
        error: (err) => {
          //console.error('Error updating merchandise:', err);
          this.snackBar.open('Failed to update merchandise', 'Close', { duration: 3000 });
          this.submitting = false;
        }
      });
    } else {
      this.merchandiseService.createMerchandise(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Merchandise created successfully', 'Close', { duration: 3000 });
          
          if (this.fileInput && this.fileInput.nativeElement.files.length > 0) {
            this.merchandiseId = response.id || null;
            this.uploadImage(this.fileInput.nativeElement.files[0]);
          }
          
          this.router.navigate(['/admin/merchandise']);
        },
        error: (err) => {
          //console.error('Error creating merchandise:', err);
          //console.error('Error details:', err.error);
          //console.error('Status:', err.status);
          //console.error('Status text:', err.statusText);
          
          let errorMessage = 'Failed to create merchandise';
          if (err.error && typeof err.error === 'string') {
            errorMessage += ': ' + err.error;
          } else if (err.error && err.error.message) {
            errorMessage += ': ' + err.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          this.submitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/merchandise']);
  }
} 