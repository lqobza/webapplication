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
import { Merchandise } from '../../../models/merchandise.model';
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
  
  // Constants for category IDs
  readonly ACCESSORY_CATEGORY_ID = 5; // Assuming 5 is the ID for accessories
  
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
        // Add default size
        this.addSize();
        // Initialize empty images array (no default image needed)
        this.merchandiseForm.setControl('images', this.fb.array([]));
      }
    });
    
    // Listen for category changes to load available sizes and handle size array
    this.merchandiseForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId) {
        console.log('Category ID changed to:', categoryId);
        
        // Skip the category change handling if we're in the middle of loading merchandise
        if (!this.loading) {
          // First load sizes for the category
          this.loadSizesForCategory(categoryId);
          
          // Then handle the category change (which may modify the sizes array)
          this.handleCategoryChange(categoryId);
          
          // Finally update the disabled state of size controls
          this.updateSizeControlsState(categoryId);
        } else {
          console.log('Skipping category change handling while loading merchandise');
          // Just load the sizes without modifying the form
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
        console.log('Loaded brands:', brands);
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.snackBar.open('Failed to load brands', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Update the disabled state of size controls based on category
   */
  updateSizeControlsState(categoryId: number): void {
    const isAccessory = categoryId === this.ACCESSORY_CATEGORY_ID;
    
    // Update all size controls
    for (let i = 0; i < this.sizesArray.length; i++) {
      const sizeControl = this.sizesArray.at(i).get('size');
      if (isAccessory) {
        sizeControl?.disable();
      } else {
        sizeControl?.enable();
      }
    }
  }

  /**
   * Handle category change by adjusting the sizes array based on the category
   */
  handleCategoryChange(categoryId: number): void {
    console.log('Category changed to:', categoryId);
    console.log('Current sizes array before handling change:', this.sizesArray.value);
    
    // If switching to accessory category
    if (categoryId === this.ACCESSORY_CATEGORY_ID) {
      // Check if we already have a "One Size" entry (which can happen when editing)
      const hasOneSizeAlready = this.sizesArray.controls.some(
        control => control.get('size')?.value === 'One Size'
      );
      
      console.log('Has One Size already:', hasOneSizeAlready);
      
      if (!hasOneSizeAlready) {
        // Clear existing sizes
        while (this.sizesArray.length) {
          this.sizesArray.removeAt(0);
        }
        
        // Add a single size with "One Size"
        const sizeGroup = this.fb.group({
          size: [{value: 'One Size', disabled: true}, Validators.required],
          inStock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
        });
        this.sizesArray.push(sizeGroup);
      } else {
        // We already have a "One Size" entry, just make sure it's the only one
        // Find the index of the "One Size" entry
        const oneSizeIndex = this.sizesArray.controls.findIndex(
          control => control.get('size')?.value === 'One Size'
        );
        
        console.log('One Size index:', oneSizeIndex);
        
        // Remove all other sizes
        for (let i = this.sizesArray.length - 1; i >= 0; i--) {
          if (i !== oneSizeIndex) {
            this.sizesArray.removeAt(i);
          }
        }
        
        // Make sure the "One Size" control is disabled
        this.sizesArray.at(0).get('size')?.disable();
      }
    } 
    // If switching from accessory to another category
    else if (this.sizesArray.length === 1 && 
             this.sizesArray.at(0).get('size')?.value === 'One Size') {
      // Clear the "One Size" entry
      this.sizesArray.removeAt(0);
      // Add a default size
      this.addSize();
    }
    
    console.log('Sizes array after handling change:', this.sizesArray.value);
  }

  loadCategories(): void {
    this.merchandiseService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('Loaded categories:', categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
  }

  loadSizesForCategory(categoryId: number): void {
    console.log(`Loading sizes for category ID: ${categoryId}`);
    this.loadingSizes = true;
    this.availableSizes = []; // Clear existing sizes while loading
    
    // For accessories, just set "One Size" and return
    if (categoryId === this.ACCESSORY_CATEGORY_ID) {
      this.availableSizes = ['One Size'];
      this.loadingSizes = false;
      return;
    }
    
    this.merchandiseService.getSizes(categoryId).subscribe({
      next: (response: any) => {
        console.log('Sizes response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          if (response.length > 0 && typeof response[0] === 'object') {
            // If response is an array of objects with a 'size' property
            this.availableSizes = response.map((item: any) => item.size || item.name || item.toString());
          } else {
            // If response is an array of strings
            this.availableSizes = response.map((item: any) => item.toString());
          }
        } else if (typeof response === 'object' && response !== null) {
          // If response is an object with items property
          const items: any[] = (response as any).items || (response as any).sizes || [];
          this.availableSizes = items.map((item: any) => 
            typeof item === 'object' ? (item.size || item.name || item.toString()) : item.toString()
          );
        } else {
          this.availableSizes = [];
        }
        
        console.log('Available sizes after processing:', this.availableSizes);
        
        // If no sizes are available, use default sizes based on category
        if (this.availableSizes.length === 0) {
          this.useDefaultSizes(categoryId);
          this.snackBar.open('Using default sizes for this category', 'Close', { duration: 3000 });
        }
        
        this.loadingSizes = false;
      },
      error: (err) => {
        console.error('Error loading sizes for category:', err);
        this.snackBar.open('Failed to load sizes, using defaults', 'Close', { duration: 3000 });
        this.useDefaultSizes(categoryId);
        this.loadingSizes = false;
      }
    });
  }
  
  useDefaultSizes(categoryId: number): void {
    // Provide default sizes based on category
    const defaultSizes: { [key: number]: string[] } = {
      1: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      2: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      3: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      4: ['28', '30', '32', '34', '36', '38', '40'],
      5: ['One Size'],
      6: ['EU36', 'EU37', 'EU38', 'EU39', 'EU40', 'EU41', 'EU42', 'EU43', 'EU44', 'EU45', 'EU46']
    };
    
    // Use default sizes for the category or a general default
    this.availableSizes = defaultSizes[categoryId] || ['S', 'M', 'L', 'XL'];
  }

  get sizesArray(): FormArray {
    return this.merchandiseForm.get('sizes') as FormArray;
  }

  get imagesArray(): FormArray {
    return this.merchandiseForm.get('images') as FormArray;
  }

  /**
   * Get currently selected sizes to prevent duplicates
   */
  getSelectedSizes(): string[] {
    return this.sizesArray.controls
      .map(control => control.get('size')?.value)
      .filter(size => size !== null && size !== undefined && size !== '');
  }

  /**
   * Get available sizes that haven't been selected yet
   */
  getAvailableSizesForSelection(currentIndex: number): string[] {
    const currentlySelectedSizes = this.getSelectedSizes();
    const currentSize = this.sizesArray.at(currentIndex).get('size')?.value;
    
    // If this is an accessory, only return "One Size"
    if (this.merchandiseForm.get('categoryId')?.value === this.ACCESSORY_CATEGORY_ID) {
      return ['One Size'];
    }
    
    // For other categories, filter out already selected sizes (except the current one)
    return this.availableSizes.filter(size => 
      size === currentSize || !currentlySelectedSizes.includes(size)
    );
  }

  addSize(): void {
    // Don't add more sizes for accessories
    if (this.merchandiseForm.get('categoryId')?.value === this.ACCESSORY_CATEGORY_ID) {
      this.snackBar.open('Accessories can only have one size', 'Close', { duration: 3000 });
      return;
    }
    
    // Get sizes that are already selected
    const selectedSizes = this.getSelectedSizes();
    
    // Find a size that hasn't been selected yet
    const availableSize = this.availableSizes.find(size => !selectedSizes.includes(size));
    
    if (!availableSize && this.availableSizes.length > 0) {
      this.snackBar.open('All available sizes have been added', 'Close', { duration: 3000 });
      return;
    }
    
    // Create the form group with enabled size control and ensure size is included
    const sizeGroup = this.fb.group({
      size: [availableSize || '', Validators.required],
      inStock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
    });
    
    this.sizesArray.push(sizeGroup);
  }

  removeSize(index: number): void {
    // Don't allow removing the only size for accessories
    if (this.merchandiseForm.get('categoryId')?.value === this.ACCESSORY_CATEGORY_ID && this.sizesArray.length <= 1) {
      this.snackBar.open('Accessories must have one size', 'Close', { duration: 3000 });
      return;
    }
    
    // Don't allow removing the last size
    if (this.sizesArray.length <= 1) {
      this.snackBar.open('At least one size is required', 'Close', { duration: 3000 });
      return;
    }
    
    this.sizesArray.removeAt(index);
  }

  addImage(): void {
    // We'll only track uploaded images, not URLs
    this.imagesArray.push(this.fb.group({
      imageUrl: ['', Validators.required], // Still required but will be filled by upload
      isPrimary: [this.imagesArray.length === 0] // First image is primary by default
    }));
  }

  removeImage(index: number): void {
    this.imagesArray.removeAt(index);
    
    // If we removed all images, no need to show empty image slots
    if (this.imagesArray.length === 0 && !this.isEditMode) {
      // Don't add an empty image slot for new merchandise
      return;
    }
    
    // If we removed the primary image, set the first one as primary
    if (this.imagesArray.length > 0 && !this.imagesArray.controls.some(control => control.get('isPrimary')?.value)) {
      this.imagesArray.at(0).get('isPrimary')?.setValue(true);
    }
  }

  setPrimaryImage(index: number): void {
    // Set all images to non-primary
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

    // Create a simulated progress
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
          // Add the new image to the form
          const imageControl = this.fb.group({
            imageUrl: [response.imageUrl, Validators.required],
            isPrimary: [this.imagesArray.length === 0] // First image is primary by default
          });
          this.imagesArray.push(imageControl);
          
          this.snackBar.open('Image uploaded successfully', 'Close', { duration: 3000 });
          
          // Reset file input
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          this.snackBar.open('Failed to upload image', 'Close', { duration: 3000 });
        }
      });
  }

  getImagePreview(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // If it's a relative URL, convert to absolute
    if (imageUrl.startsWith('/')) {
      return `${environment.apiUrl}${imageUrl}`;
    }
    
    return imageUrl;
  }

  loadMerchandise(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.merchandiseService.getMerchandiseById(id).subscribe({
      next: (merchandise) => {
        console.log('Loaded merchandise:', merchandise);
        
        // Clear existing arrays
        while (this.sizesArray.length) {
          this.sizesArray.removeAt(0);
        }
        while (this.imagesArray.length) {
          this.imagesArray.removeAt(0);
        }

        // Populate form with merchandise data
        this.merchandiseForm.patchValue({
          name: merchandise.name,
          description: merchandise.description,
          price: Math.round(merchandise.price), // Ensure price is an integer
          categoryId: merchandise.categoryId,
          brandId: merchandise.brandId || 0
        });

        // Load sizes for this category
        if (merchandise.categoryId) {
          this.loadSizesForCategory(merchandise.categoryId);
        }

        // Add sizes
        if (merchandise.sizes && merchandise.sizes.length > 0) {
          console.log('Merchandise sizes:', merchandise.sizes);
          
          // For accessories, only add the first size (which should be "One Size")
          if (merchandise.categoryId === this.ACCESSORY_CATEGORY_ID) {
            console.log('Loading accessory with One Size');
            // Find the size with "One Size" or use the first size
            const accessorySize = merchandise.sizes.find(s => s.size === 'One Size') || merchandise.sizes[0];
            
            // Create a single size group for the accessory
            const sizeGroup = this.fb.group({
              size: [{
                value: 'One Size', 
                disabled: true
              }, Validators.required],
              inStock: [accessorySize.inStock, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
            });
            
            // Add the size group to the form
            this.sizesArray.push(sizeGroup);
            
            // Log the current state of the sizes array
            console.log('Sizes array after adding accessory size:', this.sizesArray.value);
          } else {
            // For other categories, add all sizes
            merchandise.sizes.forEach(size => {
              const sizeGroup = this.fb.group({
                size: [size.size, Validators.required],
                inStock: [size.inStock, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]]
              });
              this.sizesArray.push(sizeGroup);
            });
          }
        } else {
          this.addSize(); // Add default size if none exists
        }

        // Load images
        this.merchandiseService.getMerchandiseImages(id).subscribe({
          next: (images) => {
            if (images && images.length > 0) {
              images.forEach(image => {
                this.imagesArray.push(this.fb.group({
                  imageUrl: [image.imageUrl, Validators.required],
                  isPrimary: [image.isPrimary]
                }));
              });
            } else {
              this.addImage(); // Add default image if none exists
            }
          },
          error: (err) => {
            console.error('Error loading merchandise images:', err);
            // Add a default empty image regardless of error type
            this.addImage();
            
            // If it's a 404 error, it means the merchandise has no images yet
            if (err.status === 404) {
              console.log('No images found for this merchandise. This is normal for new items.');
            } else {
              // For other errors, show a notification
              this.snackBar.open('Could not load images. You can add new ones.', 'Close', { duration: 3000 });
            }
          }
        });

        this.loading = false;
        
        // Log the final state of the sizes array after loading
        console.log('Final sizes array after loading merchandise:', this.sizesArray.value);
      },
      error: (err: any) => {
        console.error('Error loading merchandise:', err);
        this.error = 'Failed to load merchandise. Please try again later.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.merchandiseForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.merchandiseForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = { ...this.merchandiseForm.value };
    
    // Ensure price is an integer
    formData.price = Math.round(formData.price);
    
    // For new merchandise, we don't need to send the empty images array
    if (!this.isEditMode) {
      formData.images = [];
    }
    
    // For existing merchandise, ensure at least one image is marked as primary if there are images
    else if (formData.images.length > 0 && !formData.images.some((img: any) => img.isPrimary)) {
      formData.images[0].isPrimary = true;
    }

    // Add empty themeIds array if not present
    if (!formData.themeIds) {
      formData.themeIds = [];
    }

    // Fix sizes array for accessories to ensure size property is included
    if (formData.categoryId === this.ACCESSORY_CATEGORY_ID) {
      formData.sizes = formData.sizes.map((size: any) => ({
        ...size,
        size: 'One Size'
      }));
    }

    // Get the raw value of the form to include disabled controls
    const rawSizes = this.sizesArray.controls.map(control => {
      const rawValue = control.getRawValue();
      // Ensure size property is included
      return {
        size: rawValue.size,
        inStock: rawValue.inStock
      };
    });
    
    // Replace the sizes in formData with the raw values
    formData.sizes = rawSizes;

    if (this.isEditMode && this.merchandiseId) {
      // Update existing merchandise
      this.merchandiseService.updateMerchandise(this.merchandiseId, {
        id: this.merchandiseId,
        ...formData
      }).subscribe({
        next: () => {
          this.snackBar.open('Merchandise updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/merchandise']);
        },
        error: (err) => {
          console.error('Error updating merchandise:', err);
          this.snackBar.open('Failed to update merchandise', 'Close', { duration: 3000 });
          this.submitting = false;
        }
      });
    } else {
      // Create new merchandise
      this.merchandiseService.createMerchandise(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Merchandise created successfully', 'Close', { duration: 3000 });
          
          // If there are pending image uploads, we need to set the merchandise ID
          if (this.fileInput && this.fileInput.nativeElement.files.length > 0) {
            this.merchandiseId = response.id || null;
            this.uploadImage(this.fileInput.nativeElement.files[0]);
          }
          
          this.router.navigate(['/admin/merchandise']);
        },
        error: (err) => {
          console.error('Error creating merchandise:', err);
          this.snackBar.open('Failed to create merchandise', 'Close', { duration: 3000 });
          this.submitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/merchandise']);
  }
} 