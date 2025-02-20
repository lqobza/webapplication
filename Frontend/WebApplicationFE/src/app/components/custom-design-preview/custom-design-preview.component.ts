import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';

interface CustomProduct {
  id: string;
  designUrl: string;
  tshirtColor: string;
  size: string;
  price: number;
  quantity: number;
  rotation: number;
}

@Component({
  selector: 'app-custom-design-preview',
  templateUrl: './custom-design-preview.component.html',
  styleUrls: ['./custom-design-preview.component.scss'],
  standalone: true,
  imports: [CommonModule, ColorPickerModule]
})
export class CustomDesignPreviewComponent implements OnInit {
  @ViewChild('designCanvas') designCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedColor: string = '#ffffff';
  selectedSize: string = 'M';
  designScale: number = 1;
  baseScale: number = 1;
  designPosition = { x: 0, y: 0 };
  isDragging: boolean = false;
  dragStart = { x: 0, y: 0 };
  
  availableColors = [
    '#ffffff', '#000000', '#ff0000', '#0000ff', '#808080'
  ];
  
  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  designRotation: number = 0;
  
  customProduct: CustomProduct = {
    id: 'custom-' + Date.now(),
    designUrl: '',
    tshirtColor: this.selectedColor,
    size: this.selectedSize,
    price: 30,
    quantity: 1,
    rotation: 0
  };

  private currentDesignImage: HTMLImageElement | null = null;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    // Wait for the next tick to ensure canvas is properly initialized
    setTimeout(() => {
      this.initializeCanvas();
    }, 0);
  }

  initializeCanvas(): void {
    const canvas = this.designCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw initial t-shirt template
      this.drawTshirtTemplate();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.customProduct.designUrl = img.src;
          this.currentDesignImage = img;
          
          const maxWidth = this.designCanvas.nativeElement.width * 0.3;
          this.baseScale = maxWidth / img.width;
          this.designScale = this.baseScale;
          
          this.drawTshirtTemplate();
          this.drawDesign(img);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  drawTshirtTemplate(): void {
    const canvas = this.designCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate t-shirt dimensions and position
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Adjust these values to better center the t-shirt
    const desiredTshirtHeight = canvasHeight * 0.80;
    const originalTshirtHeight = 360;
    const scale = desiredTshirtHeight / originalTshirtHeight;
    const scaledTshirtWidth = 400 * scale;
    
    // Center horizontally and adjust vertical position slightly upward
    const xOffset = (canvasWidth - scaledTshirtWidth) / 2;
    const yOffset = (canvasHeight - desiredTshirtHeight) / 2 - (canvasHeight * 0.07);

    ctx.save();
    ctx.translate(xOffset, yOffset);
    ctx.scale(scale, scale);

    // Set the t-shirt color
    ctx.fillStyle = this.selectedColor;

    // Start drawing t-shirt
    ctx.beginPath();

    // Collar
    ctx.moveTo(160, 40);  // Left collar
    ctx.bezierCurveTo(180, 30, 220, 30, 240, 40);  // Collar curve
    
    // Shoulders
    ctx.lineTo(300, 80);  // Right shoulder
    ctx.lineTo(340, 150); // Right sleeve
    ctx.lineTo(280, 170); // Right sleeve bottom
    
    // Right side
    ctx.lineTo(270, 400); // Right bottom
    
    // Bottom
    ctx.lineTo(130, 400); // Left bottom
    
    // Left side
    ctx.lineTo(120, 170); // Left sleeve bottom
    ctx.lineTo(60, 150);  // Left sleeve
    ctx.lineTo(100, 80);  // Left shoulder
    ctx.closePath();

    // Fill t-shirt with selected color
    ctx.fill();

    // Add shadow/depth
    ctx.strokeStyle = this.adjustColor(this.selectedColor, -20);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add collar details
    ctx.beginPath();
    ctx.moveTo(170, 45);
    ctx.bezierCurveTo(185, 35, 215, 35, 230, 45);
    ctx.strokeStyle = this.adjustColor(this.selectedColor, -30);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add sleeve creases
    this.drawCrease(ctx, 70, 140, 110, 160);   // Left sleeve
    this.drawCrease(ctx, 330, 140, 290, 160);  // Right sleeve

    // Add body creases
    this.drawCrease(ctx, 140, 200, 150, 350);  // Left body
    this.drawCrease(ctx, 260, 200, 250, 350);  // Right body

    ctx.restore();
  }

  private drawCrease(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number): void {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = this.adjustColor(this.selectedColor, -10);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private adjustColor(color: string, amount: number): string {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    
    // Convert back to hex
    return '#' + 
      r.toString(16).padStart(2, '0') + 
      g.toString(16).padStart(2, '0') + 
      b.toString(16).padStart(2, '0');
  }

  drawDesign(img: HTMLImageElement): void {
    const canvas = this.designCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scaled dimensions
    const scaledWidth = img.width * this.designScale;
    const scaledHeight = img.height * this.designScale;

    // Adjust design position to be centered on the t-shirt chest
    const designX = canvas.width/2 - scaledWidth/2 + this.designPosition.x;
    const designY = canvas.height * 0.35 - scaledHeight/2 + this.designPosition.y; // Adjusted from 0.25 to 0.35

    // Save the current context state
    ctx.save();

    // Move to the center of where we want to draw the image
    ctx.translate(designX + scaledWidth/2, designY + scaledHeight/2);
    
    // Rotate the context
    ctx.rotate(this.designRotation * Math.PI / 180);
    
    // Draw the image centered at the origin
    ctx.drawImage(
      img,
      -scaledWidth/2,
      -scaledHeight/2,
      scaledWidth,
      scaledHeight
    );

    // Restore the context state
    ctx.restore();
  }

  onColorSelect(color: string): void {
    this.selectedColor = color;
    this.customProduct.tshirtColor = color;
    this.drawTshirtTemplate();
    if (this.customProduct.designUrl) {
      const img = new Image();
      img.onload = () => this.drawDesign(img);
      img.src = this.customProduct.designUrl;
    }
  }

  onSizeSelect(size: string): void {
    this.selectedSize = size;
    this.customProduct.size = size;
  }

  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.designPosition.x,
      y: event.clientY - this.designPosition.y
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.designPosition = {
        x: event.clientX - this.dragStart.x,
        y: event.clientY - this.dragStart.y
      };
      this.drawTshirtTemplate();
      if (this.customProduct.designUrl) {
        const img = new Image();
        img.onload = () => this.drawDesign(img);
        img.src = this.customProduct.designUrl;
      }
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onScaleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const scaleMultiplier = parseFloat(input.value);
    this.designScale = this.baseScale * scaleMultiplier;

    if (this.currentDesignImage) {
      this.drawTshirtTemplate();
      this.drawDesign(this.currentDesignImage);
    }
  }

  onRotationChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.designRotation = parseFloat(input.value);
    this.customProduct.rotation = this.designRotation;
    
    this.drawTshirtTemplate();
    if (this.currentDesignImage) {
      this.drawDesign(this.currentDesignImage);
    }
  }

  addToCart(): void {
    this.cartService.addToCart(this.customProduct);
  }
}