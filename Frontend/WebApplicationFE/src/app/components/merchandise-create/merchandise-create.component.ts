import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-merchandise-create',
  templateUrl: './merchandise-create.component.html',
  styleUrls: ['./merchandise-create.component.css']
})
export class MerchandiseCreateComponent {
  merchandiseForm: FormGroup;

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
      size: ['', Validators.required],
      brandId: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.merchandiseForm.valid) {
      const newMerchandise: Merchandise = this.merchandiseForm.value;
      this.merchandiseService.insertMerchandise(newMerchandise).subscribe(
        () => this.router.navigate(['/merchandise']),
        error => console.error('Error creating merchandise', error)
      );
    }
  }
}
