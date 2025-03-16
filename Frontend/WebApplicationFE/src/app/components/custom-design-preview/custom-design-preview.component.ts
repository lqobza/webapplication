import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface CustomDesign {
  id?: number;
  userId: number;
  name: string;
  frontImage: string;
  backImage: string;
  createdAt?: Date;
}

interface CustomProduct {
  id: string;
  name: string;
  frontImage: string;
  backImage: string;
  tshirtColor: string;
  size: string;
  price: number;
  quantity: number;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  isDragging: boolean;
}

interface ImageElement {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isDragging: boolean;
}

// Define a type for the t-shirt side
type TShirtSide = 'front' | 'back';

@Component({
  selector: 'app-custom-design-preview',
  templateUrl: './custom-design-preview.component.html',
  styleUrls: ['./custom-design-preview.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ColorPickerModule, 
    FormsModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatSliderModule, 
    MatIconModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    MatSlideToggleModule
  ]
})
export class CustomDesignPreviewComponent implements OnInit, AfterViewInit {
  @ViewChild('designCanvas') designCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // T-shirt properties
  selectedColor: string = '#ffffff';
  selectedSize: string = 'M';
  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  tshirtFrontImage: HTMLImageElement = new Image();
  tshirtBackImage: HTMLImageElement = new Image();
  
  // Current side being edited
  currentSide: TShirtSide = 'front';
  
  // Design elements for both sides
  frontTextElements: TextElement[] = [];
  frontImageElements: ImageElement[] = [];
  backTextElements: TextElement[] = [];
  backImageElements: ImageElement[] = [];
  
  // Active element for editing
  activeElement: TextElement | ImageElement | null = null;
  
  // New text properties
  newText: string = '';
  fontSize: number = 24;
  fontFamily: string = 'Arial';
  textColor: string = '#000000';
  
  // Design name for saving
  designName: string = '';
  
  // Available font families
  fontFamilies = [
    'Arial', 
    'Verdana', 
    'Times New Roman', 
    'Courier New', 
    'Georgia', 
    'Comic Sans MS'
  ];
  
  // Canvas dimensions
  canvasWidth = 600;
  canvasHeight = 700;
  
  // Modifiable area constraints
  modifiableAreaX = 150;
  modifiableAreaY = 100;
  modifiableAreaWidth = 300;
  modifiableAreaHeight = 580;
  showModifiableArea = true;
  
  // Product info
  customProduct: CustomProduct = {
    id: 'custom-' + Date.now(),
    name: this.designName,
    frontImage: '',
    backImage: '',
    tshirtColor: this.selectedColor,
    size: this.selectedSize,
    price: 30,
    quantity: 1
  };

  // Drag state
  dragStartX = 0;
  dragStartY = 0;
  
  // Loading state
  isLoading = false;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load the t-shirt images
    this.tshirtFrontImage.src = 'assets/images/tshirt-front.png';
    this.tshirtBackImage.src = 'assets/images/tshirt-back.png';
    
    this.tshirtFrontImage.onload = () => {
      this.renderCanvas();
    };
    
    this.tshirtBackImage.onload = () => {
      // Only render if we're viewing the back
      if (this.currentSide === 'back') {
        this.renderCanvas();
      }
    };
  }

  ngAfterViewInit(): void {
    // Set up canvas event listeners after view is initialized
    const canvas = this.designCanvas.nativeElement;
    
    canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleCanvasMouseUp.bind(this));
    
    // Initial render
    this.renderCanvas();
  }

  // Get the current elements based on which side is active
  get currentTextElements(): TextElement[] {
    return this.currentSide === 'front' ? this.frontTextElements : this.backTextElements;
  }

  get currentImageElements(): ImageElement[] {
    return this.currentSide === 'front' ? this.frontImageElements : this.backImageElements;
  }

  // Switch between front and back views
  switchSide(side: TShirtSide): void {
    if (this.currentSide !== side) {
      this.currentSide = side;
      this.activeElement = null; // Clear active element when switching sides
      this.renderCanvas();
    }
  }

  renderCanvas(): void {
    const canvas = this.designCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw t-shirt with selected color based on current side
    this.drawTshirtWithColor(ctx);

    // Draw all image elements for the current side
    this.currentImageElements.forEach(img => this.drawImageElement(ctx, img));

    // Draw all text elements for the current side
    this.currentTextElements.forEach(text => this.drawTextElement(ctx, text));
  }

  drawTshirtWithColor(ctx: CanvasRenderingContext2D): void {
    // Choose the correct image based on current side
    const tshirtImage = this.currentSide === 'front' ? this.tshirtFrontImage : this.tshirtBackImage;
    
    // Clear the canvas
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Create a temporary canvas to manipulate the image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvasWidth;
    tempCanvas.height = this.canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Draw the t-shirt image on the temporary canvas
    tempCtx.drawImage(tshirtImage, 0, 0, this.canvasWidth, this.canvasHeight);
    
    // Get the image data
    const imageData = tempCtx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    const data = imageData.data;
    
    // Modify the image data to apply the color to the t-shirt body
    // Convert the selected color from hex to RGB
    const hexToRgb = (hex: string): {r: number, g: number, b: number} => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 };
    };
    
    const color = hexToRgb(this.selectedColor);
    
    // Loop through all pixels
    for (let i = 0; i < data.length; i += 4) {
      // Get the alpha value (transparency)
      const alpha = data[i + 3];
      
      // Skip fully transparent pixels
      if (alpha === 0) continue;
      
      // Check if this is a white or light gray pixel (part of the t-shirt body)
      // We use a threshold to identify "white-ish" pixels
      const isWhitePixel = 
        data[i] > 230 && 
        data[i + 1] > 230 && 
        data[i + 2] > 230;
      
      // Check if this is a black or dark pixel (part of the outline)
      const isDarkPixel = 
        data[i] < 50 && 
        data[i + 1] < 50 && 
        data[i + 2] < 50;
      
      const isBlackPixel = 
        data[i] < 10 && 
        data[i + 1] < 10 && 
        data[i + 2] < 10;
      // Only color the white/light parts of the t-shirt (the body)
      if (isWhitePixel && !isDarkPixel) {
        // Apply the selected color
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;

      } else if (!isBlackPixel){
        data[i] = color.r*0.4;
        data[i + 1] = color.g*0.4;
        data[i + 2] = color.b*0.4;
      }
    }
    
    // Put the modified image data back on the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw the modified image to the main canvas
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Draw the modifiable area if enabled
    if (this.showModifiableArea) {
      ctx.strokeStyle = '#3f51b5';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        this.modifiableAreaX, 
        this.modifiableAreaY, 
        this.modifiableAreaWidth, 
        this.modifiableAreaHeight
      );
      ctx.setLineDash([]);
    }
  }
  
  // Helper method to determine if a color is dark
  isColorDark(hexColor: string): boolean {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate brightness (using the formula for relative luminance)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if the color is dark (brightness < 128)
    return brightness < 128;
  }

  drawTextElement(ctx: CanvasRenderingContext2D, element: TextElement): void {
    ctx.save();
    
    // Move to the text position and apply rotation
    ctx.translate(element.x, element.y);
    ctx.rotate(element.rotation * Math.PI / 180);
    
    // Set text properties
    ctx.font = `${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textAlign = 'center';
    
    // Draw the text
    ctx.fillText(element.text, 0, 0);
    
    // Draw selection box if this is the active element
    if (this.activeElement === element) {
      const metrics = ctx.measureText(element.text);
      const height = element.fontSize;
      const width = metrics.width;
      
      ctx.strokeStyle = '#0099ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10);
      
      // Draw rotation handle
      ctx.fillStyle = '#0099ff';
      ctx.beginPath();
      ctx.arc(0, -height/2 - 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawImageElement(ctx: CanvasRenderingContext2D, element: ImageElement): void {
    // Create an image object if we only have the URL
    const img = new Image();
    img.src = element.url;
    
    // Only proceed if the image is loaded
    if (!img.complete) {
      img.onload = () => this.renderCanvas();
      return;
    }
    
    ctx.save();
    
    // Move to the image position and apply rotation
    ctx.translate(element.x, element.y);
    ctx.rotate(element.rotation * Math.PI / 180);
    
    // Draw the image centered at its position
    ctx.drawImage(img, -element.width/2, -element.height/2, element.width, element.height);
    
    // Draw selection box if this is the active element
    if (this.activeElement === element) {
      ctx.strokeStyle = '#0099ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-element.width/2 - 5, -element.height/2 - 5, element.width + 10, element.height + 10);
      
      // Draw rotation handle
      ctx.fillStyle = '#0099ff';
      ctx.beginPath();
      ctx.arc(0, -element.height/2 - 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  handleCanvasMouseDown(event: MouseEvent): void {
    const canvas = this.designCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if we clicked on any element (in reverse order to select top elements first)
    this.activeElement = null;
    
    // Check text elements
    for (let i = this.currentTextElements.length - 1; i >= 0; i--) {
      const text = this.currentTextElements[i];
      if (this.isPointInText(x, y, text)) {
        this.activeElement = text;
        text.isDragging = true;
        this.dragStartX = x - text.x;
        this.dragStartY = y - text.y;
        break;
      }
    }
    
    // Check image elements if no text element was clicked
    if (!this.activeElement) {
      for (let i = this.currentImageElements.length - 1; i >= 0; i--) {
        const img = this.currentImageElements[i];
        if (this.isPointInImage(x, y, img)) {
          this.activeElement = img;
          img.isDragging = true;
          this.dragStartX = x - img.x;
          this.dragStartY = y - img.y;
          break;
        }
      }
    }
    
    this.renderCanvas();
  }

  handleCanvasMouseMove(event: MouseEvent): void {
    if (!this.activeElement || !this.activeElement.isDragging) return;
    
    const canvas = this.designCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate new position
    let newX = x - this.dragStartX;
    let newY = y - this.dragStartY;
    
    // Constrain to modifiable area
    if ('width' in this.activeElement) {
      // For images, constrain based on the image dimensions
      const halfWidth = this.activeElement.width / 2;
      const halfHeight = this.activeElement.height / 2;
      
      newX = Math.max(this.modifiableAreaX + halfWidth, Math.min(newX, this.modifiableAreaX + this.modifiableAreaWidth - halfWidth));
      newY = Math.max(this.modifiableAreaY + halfHeight, Math.min(newY, this.modifiableAreaY + this.modifiableAreaHeight - halfHeight));
    } else {
      // For text, use an approximate constraint
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${this.activeElement.fontSize}px ${this.activeElement.fontFamily}`;
        const metrics = ctx.measureText(this.activeElement.text);
        const halfWidth = metrics.width / 2;
        const halfHeight = this.activeElement.fontSize / 2;
        
        newX = Math.max(this.modifiableAreaX + halfWidth, Math.min(newX, this.modifiableAreaX + this.modifiableAreaWidth - halfWidth));
        newY = Math.max(this.modifiableAreaY + halfHeight, Math.min(newY, this.modifiableAreaY + this.modifiableAreaHeight - halfHeight));
      }
    }
    
    // Update element position
    this.activeElement.x = newX;
    this.activeElement.y = newY;
    
    this.renderCanvas();
  }

  handleCanvasMouseUp(): void {
    if (this.activeElement) {
      this.activeElement.isDragging = false;
    }
  }

  isPointInText(x: number, y: number, text: TextElement): boolean {
    const canvas = this.designCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    ctx.font = `${text.fontSize}px ${text.fontFamily}`;
    const metrics = ctx.measureText(text.text);
    const width = metrics.width;
    const height = text.fontSize;
    
    // Account for rotation
    const rotatedPoint = this.rotatePoint(
      x - text.x, 
      y - text.y, 
      -text.rotation * Math.PI / 180
    );
    
    // Check if point is inside text bounding box
    return (
      rotatedPoint.x >= -width/2 - 5 &&
      rotatedPoint.x <= width/2 + 5 &&
      rotatedPoint.y >= -height/2 - 5 &&
      rotatedPoint.y <= height/2 + 5
    );
  }

  isPointInImage(x: number, y: number, img: ImageElement): boolean {
    // Account for rotation
    const rotatedPoint = this.rotatePoint(
      x - img.x, 
      y - img.y, 
      -img.rotation * Math.PI / 180
    );
    
    // Check if point is inside image bounding box
    return (
      rotatedPoint.x >= -img.width/2 - 5 &&
      rotatedPoint.x <= img.width/2 + 5 &&
      rotatedPoint.y >= -img.height/2 - 5 &&
      rotatedPoint.y <= img.height/2 + 5
    );
  }

  rotatePoint(x: number, y: number, angle: number): {x: number, y: number} {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  onColorSelect(color: string): void {
    this.selectedColor = color;
    this.customProduct.tshirtColor = color;
    this.renderCanvas();
  }

  onSizeSelect(size: string): void {
    this.selectedSize = size;
    this.customProduct.size = size;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate appropriate size while maintaining aspect ratio
          const maxWidth = this.canvasWidth * 0.3;
          const maxHeight = this.canvasHeight * 0.3;
          
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }
          
          // Add new image element to the current side
          const newImage: ImageElement = {
            id: 'img-' + Date.now(),
            url: img.src,
            x: this.modifiableAreaX + (this.modifiableAreaWidth / 2),
            y: this.modifiableAreaY + (this.modifiableAreaHeight / 2),
            width: width,
            height: height,
            rotation: 0,
            isDragging: false
          };
          
          if (this.currentSide === 'front') {
            this.frontImageElements.push(newImage);
          } else {
            this.backImageElements.push(newImage);
          }
          
          this.activeElement = newImage;
          this.renderCanvas();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
      
      // Reset file input
      input.value = '';
    }
  }

  addText(): void {
    if (!this.newText.trim()) return;
    
    const newTextElement: TextElement = {
      id: 'text-' + Date.now(),
      text: this.newText,
      x: this.modifiableAreaX + (this.modifiableAreaWidth / 2),
      y: this.modifiableAreaY + (this.modifiableAreaHeight / 2),
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      color: this.textColor,
      rotation: 0,
      isDragging: false
    };
    
    // Add to the current side
    if (this.currentSide === 'front') {
      this.frontTextElements.push(newTextElement);
    } else {
      this.backTextElements.push(newTextElement);
    }
    
    this.activeElement = newTextElement;
    this.newText = '';
    this.renderCanvas();
  }

  deleteActiveElement(): void {
    if (!this.activeElement) return;
    
    if ('text' in this.activeElement) {
      if (this.currentSide === 'front') {
        this.frontTextElements = this.frontTextElements.filter(t => t.id !== this.activeElement?.id);
      } else {
        this.backTextElements = this.backTextElements.filter(t => t.id !== this.activeElement?.id);
      }
    } else {
      if (this.currentSide === 'front') {
        this.frontImageElements = this.frontImageElements.filter(i => i.id !== this.activeElement?.id);
      } else {
        this.backImageElements = this.backImageElements.filter(i => i.id !== this.activeElement?.id);
      }
    }
    
    this.activeElement = null;
    this.renderCanvas();
  }

  rotateActiveElement(degrees: number): void {
    if (!this.activeElement) return;
    
    this.activeElement.rotation += degrees;
    this.renderCanvas();
  }

  // Capture the current canvas as a data URL
  captureCanvasImage(): string {
    const canvas = this.designCanvas.nativeElement;
    
    // Store the current active element
    const tempActiveElement = this.activeElement;
    
    // Temporarily remove selection to avoid capturing selection indicators
    this.activeElement = null;
    this.renderCanvas();
    
    // Capture the canvas
    const dataUrl = canvas.toDataURL('image/png');
    
    // Restore the active element
    this.activeElement = tempActiveElement;
    this.renderCanvas();
    
    return dataUrl;
  }

  saveDesign(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.designName.trim()) {
        this.snackBar.open('Please enter a name for your design', 'Close', { duration: 3000 });
        reject('Design name is required');
        return;
      }
      
      if (!this.authService.isLoggedIn()) {
        this.snackBar.open('You must be logged in to save designs', 'Close', { duration: 3000 });
        reject('User must be logged in');
        return;
      }
      
      this.isLoading = true;
      
      // Store the current active element and side
      const originalActiveElement = this.activeElement;
      const originalSide = this.currentSide;
      
      // We need to capture both sides of the t-shirt
      // First, capture the current side
      const currentSideImage = this.captureCanvasImage();
      
      // Then switch to the other side, render it, and capture
      const otherSide = originalSide === 'front' ? 'back' : 'front';
      
      this.switchSide(otherSide);
      // Need to wait for the canvas to render
      setTimeout(() => {
        const otherSideImage = this.captureCanvasImage();
        
        // Switch back to the original side and restore active element
        this.switchSide(originalSide);
        this.activeElement = originalActiveElement;
        this.renderCanvas();
        
        // Create the design object with both sides
        const design = {
          userId: this.authService.getCurrentUserId().toString(),
          name: this.designName,
          frontImage: originalSide === 'front' ? currentSideImage : otherSideImage,
          backImage: originalSide === 'back' ? currentSideImage : otherSideImage
        };
        
        // Send to the backend
        this.http.post<{id: number}>(`${environment.apiUrl}/api/customdesign`, design, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.snackBar.open('Design saved successfully!', 'Close', { duration: 3000 });
            this.designName = '';
            resolve(response.id);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error saving design:', error);
            
            let errorMessage = 'Failed to save design. Please try again.';
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
            reject(errorMessage);
          }
        });
      }, 100); // Small delay to ensure canvas renders
    });
  }

  addToCart(): void {
    if (!this.designName.trim()) {
      this.snackBar.open('Please enter a name for your design before adding to cart', 'Close', { duration: 3000 });
      return;
    }
    
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('You must be logged in to save designs and add to cart', 'Close', { duration: 3000 });
      return;
    }
    
    this.isLoading = true;
    
    // Save the design first and get the ID
    this.saveDesign()
      .then(designId => {
        // Fetch the saved design from the backend
        this.http.get<CustomDesign>(`${environment.apiUrl}/api/customdesign/${designId}`)
          .subscribe({
            next: (savedDesign) => {
              this.isLoading = false;
              
              // Create a custom product from the saved design
              const customProduct: CustomProduct = {
                id: 'custom-' + savedDesign.id,
                name: savedDesign.name,
                frontImage: savedDesign.frontImage,
                backImage: savedDesign.backImage,
                tshirtColor: this.selectedColor,
                size: this.selectedSize,
                price: 30,
                quantity: 1
              };
              
              // Add to cart
              this.cartService.addToCart(customProduct);
              this.snackBar.open('Design saved and added to cart!', 'Close', { duration: 3000 });
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error fetching saved design:', error);
              this.snackBar.open('Design was saved but could not be added to cart. Please try again.', 'Close', { duration: 5000 });
            }
          });
      })
      .catch(error => {
        this.isLoading = false;
        console.error('Error in save and add to cart process:', error);
      });
  }

  clearDesign(): void {
    // Clear only the current side
    if (this.currentSide === 'front') {
      this.frontTextElements = [];
      this.frontImageElements = [];
    } else {
      this.backTextElements = [];
      this.backImageElements = [];
    }
    
    this.activeElement = null;
    this.renderCanvas();
    this.snackBar.open(`Cleared the ${this.currentSide} design`, 'Close', { duration: 2000 });
  }

  clearAllDesigns(): void {
    // Clear both sides
    this.frontTextElements = [];
    this.frontImageElements = [];
    this.backTextElements = [];
    this.backImageElements = [];
    
    this.activeElement = null;
    this.renderCanvas();
    this.snackBar.open('Cleared all designs', 'Close', { duration: 2000 });
  }
}