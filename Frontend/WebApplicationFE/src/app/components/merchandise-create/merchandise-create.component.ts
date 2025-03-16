import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';
import { Router } from '@angular/router';
import { Category } from 'src/app/models/category.model';
import { Brand } from 'src/app/models/brand.model';

@Component({
  selector: 'app-merchandise-create',
  templateUrl: './merchandise-create.component.html',
  styleUrls: ['./merchandise-create.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MerchandiseCreateComponent {
  merchandiseForm: FormGroup;
  categories: Category[] = [];
  brands: Brand[] = [];
  sizes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private merchandiseService: MerchandiseService,
    private router: Router
  ) {
    this.merchandiseForm = this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', Validators.required],
      inStock: ['', Validators.required],
      price: ['', Validators.required],
      description: ['', Validators.required],
      size: new FormControl({ value: '', disabled: !this.categories.length || !this.sizes.length }, Validators.required),
      brandId: ['', Validators.required]
    });

    this.merchandiseService.getCategories().subscribe(categories => {
      this.categories = categories;
    });

    this.merchandiseService.getBrands().subscribe(brands => {
      this.brands = brands;
    });
  }

  fetchSizes() {
    const selectedCategoryId = this.merchandiseForm.value.categoryId;
  
    this.merchandiseService.getSizes(selectedCategoryId).subscribe(
      sizes => {
        this.sizes = sizes;
  
        if (sizes.length > 0) {
          this.merchandiseForm.get('size')?.enable();
        } else {
          this.merchandiseForm.get('size')?.disable();
          this.merchandiseForm.get('size')?.setValue('');
        }
      },
      error => {
        if (error.status === 400) {
  
          this.merchandiseForm.get('size')?.disable();
          this.merchandiseForm.get('size')?.setValue('');
        }
      }
    );
  }

  onSubmit(): void {
    if (this.merchandiseForm.valid) {
      const newMerchandise: Merchandise = this.merchandiseForm.value;
  
      // add the selected size
      this.merchandiseService.insertMerchandise(newMerchandise).subscribe(
        () => this.router.navigate(['/merchandise']),
        error => console.error('Error creating merchandise', error)
      );
    }
  }
}
