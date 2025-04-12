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

  selectedColor: string = '#ffffff';
  selectedSize: string = 'M';
  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  tshirtFrontImage: HTMLImageElement = new Image();
  tshirtBackImage: HTMLImageElement = new Image();
  
  currentSide: TShirtSide = 'front';
  
  frontTextElements: TextElement[] = [];
  frontImageElements: ImageElement[] = [];
  backTextElements: TextElement[] = [];
  backImageElements: ImageElement[] = [];
  
  activeElement: TextElement | ImageElement | null = null;
  
  newText: string = '';
  fontSize: number = 24;
  fontFamily: string = 'Arial';
  textColor: string = '#000000';
  
  designName: string = '';
  
  fontFamilies = [
    'Arial', 
    'Verdana', 
    'Times New Roman', 
    'Courier New', 
    'Georgia', 
    'Comic Sans MS'
  ];
  
  canvasWidth = 600;
  canvasHeight = 700;
  
  modifiableAreaX = 150;
  modifiableAreaY = 100;
  modifiableAreaWidth = 300;
  modifiableAreaHeight = 580;
  showModifiableArea = true;
  
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

  dragStartX = 0;
  dragStartY = 0;
  
  isLoading = false;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.tshirtFrontImage.src = 'assets/images/tshirt-front.png';
    this.tshirtBackImage.src = 'assets/images/tshirt-back.png';
    
    this.tshirtFrontImage.onload = () => {
      this.renderCanvas();
    };
    
    this.tshirtBackImage.onload = () => {
      if (this.currentSide === 'back') {
        this.renderCanvas();
      }
    };
  }

  ngAfterViewInit(): void {
    const canvas = this.designCanvas.nativeElement;
    
    canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleCanvasMouseUp.bind(this));
    
    this.renderCanvas();
  }

  get currentTextElements(): TextElement[] {
    return this.currentSide === 'front' ? this.frontTextElements : this.backTextElements;
  }

  get currentImageElements(): ImageElement[] {
    return this.currentSide === 'front' ? this.frontImageElements : this.backImageElements;
  }

  switchSide(side: TShirtSide): void {
    if (this.currentSide !== side) {
      this.currentSide = side;
      this.activeElement = null;
      this.renderCanvas();
    }
  }

  renderCanvas(): void {
    const canvas = this.designCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawTshirtWithColor(ctx);
    
    this.currentImageElements.forEach(img => this.drawImageElement(ctx, img));
    this.currentTextElements.forEach(text => this.drawTextElement(ctx, text));
  }

  drawTshirtWithColor(ctx: CanvasRenderingContext2D): void {
    const tshirtImage = this.currentSide === 'front' ? this.tshirtFrontImage : this.tshirtBackImage;
    
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvasWidth;
    tempCanvas.height = this.canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCtx.drawImage(tshirtImage, 0, 0, this.canvasWidth, this.canvasHeight);
    
    const imageData = tempCtx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    const data = imageData.data;
    
    const hexToRgb = (hex: string): {r: number, g: number, b: number} => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 };
    };
    
    const color = hexToRgb(this.selectedColor);
    
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      
      if (alpha === 0) continue;
      
      const isWhitePixel = 
        data[i] > 230 && 
        data[i + 1] > 230 && 
        data[i + 2] > 230;
      
      const isDarkPixel = 
        data[i] < 50 && 
        data[i + 1] < 50 && 
        data[i + 2] < 50;
      
      const isBlackPixel = 
        data[i] < 10 && 
        data[i + 1] < 10 && 
        data[i + 2] < 10;
      if (isWhitePixel && !isDarkPixel) {
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;

      } else if (!isBlackPixel){
        data[i] = color.r*0.4;
        data[i + 1] = color.g*0.4;
        data[i + 2] = color.b*0.4;
      }
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    
    ctx.drawImage(tempCanvas, 0, 0);
    
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
  
  isColorDark(hexColor: string): boolean {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness < 128;
  }

  drawTextElement(ctx: CanvasRenderingContext2D, element: TextElement): void {
    ctx.save();
    
    ctx.translate(element.x, element.y);
    ctx.rotate(element.rotation * Math.PI / 180);
    
    ctx.font = `${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textAlign = 'center';
    
    ctx.fillText(element.text, 0, 0);
    
    if (this.activeElement === element) {
      const metrics = ctx.measureText(element.text);
      const height = element.fontSize;
      const width = metrics.width;
      
      ctx.strokeStyle = '#0099ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10);
      
      ctx.fillStyle = '#0099ff';
      ctx.beginPath();
      ctx.arc(0, -height/2 - 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawImageElement(ctx: CanvasRenderingContext2D, element: ImageElement): void {
    const img = new Image();
    img.src = element.url;
    
    if (!img.complete) {
      img.onload = () => this.renderCanvas();
      return;
    }
    
    ctx.save();
    
    ctx.translate(element.x, element.y);
    ctx.rotate(element.rotation * Math.PI / 180);
    
    ctx.drawImage(img, -element.width/2, -element.height/2, element.width, element.height);
    
    if (this.activeElement === element) {
      ctx.strokeStyle = '#0099ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-element.width/2 - 5, -element.height/2 - 5, element.width + 10, element.height + 10);
      
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
    
    this.activeElement = null;
    
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
    
    let newX = x - this.dragStartX;
    let newY = y - this.dragStartY;
    
    if ('width' in this.activeElement) {
      const halfWidth = this.activeElement.width / 2;
      const halfHeight = this.activeElement.height / 2;
      
      newX = Math.max(this.modifiableAreaX + halfWidth, Math.min(newX, this.modifiableAreaX + this.modifiableAreaWidth - halfWidth));
      newY = Math.max(this.modifiableAreaY + halfHeight, Math.min(newY, this.modifiableAreaY + this.modifiableAreaHeight - halfHeight));
    } else {
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
    
    const rotatedPoint = this.rotatePoint(
      x - text.x, 
      y - text.y, 
      -text.rotation * Math.PI / 180
    );
    
    return (
      rotatedPoint.x >= -width/2 - 5 &&
      rotatedPoint.x <= width/2 + 5 &&
      rotatedPoint.y >= -height/2 - 5 &&
      rotatedPoint.y <= height/2 + 5
    );
  }

  isPointInImage(x: number, y: number, img: ImageElement): boolean {
    const rotatedPoint = this.rotatePoint(
      x - img.x, 
      y - img.y, 
      -img.rotation * Math.PI / 180
    );
    
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

  captureCanvasImage(): string {
    const canvas = this.designCanvas.nativeElement;
    
    const tempActiveElement = this.activeElement;
    
    this.activeElement = null;
    this.renderCanvas();
    
    const dataUrl = canvas.toDataURL('image/png');
    
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
      
      const originalActiveElement = this.activeElement;
      const originalSide = this.currentSide;
      
      this.showModifiableArea = false;
      this.renderCanvas();
      
      const currentSideImage = this.captureCanvasImage();
      
      const otherSide = originalSide === 'front' ? 'back' : 'front';
      
      this.switchSide(otherSide);
      setTimeout(() => {
        const otherSideImage = this.captureCanvasImage();
        
        this.switchSide(originalSide);
        this.activeElement = originalActiveElement;
        this.renderCanvas();
        
        const design = {
          userId: this.authService.getCurrentUserId().toString(),
          name: this.designName,
          frontImage: originalSide === 'front' ? currentSideImage : otherSideImage,
          backImage: originalSide === 'back' ? currentSideImage : otherSideImage
        };
        
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
      }, 100);
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
    
    this.saveDesign()
      .then(designId => {
        this.http.get<CustomDesign>(`${environment.apiUrl}/api/customdesign/${designId}`)
          .subscribe({
            next: (savedDesign) => {
              this.isLoading = false;
              
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
    this.frontTextElements = [];
    this.frontImageElements = [];
    this.backTextElements = [];
    this.backImageElements = [];
    
    this.activeElement = null;
    this.renderCanvas();
    this.snackBar.open('Cleared all designs', 'Close', { duration: 2000 });
  }
}