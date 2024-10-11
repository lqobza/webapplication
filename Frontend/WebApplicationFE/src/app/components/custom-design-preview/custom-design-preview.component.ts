import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-custom-design-preview',
  templateUrl: './custom-design-preview.component.html',
  styleUrls: ['./custom-design-preview.component.css']
})
export class CustomDesignPreviewComponent implements OnInit, AfterViewInit {
  @ViewChild('previewCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private isDragging = false;
  private startX = 0;
  private startY = 0;

  x = 0;
  y = 0;
  img = new Image();
  merchTemplate = new Image();

  ngOnInit(): void {
    // Load static test image and merch template
    this.img.src = './assets/test-overlay.png'; 

    this.merchTemplate.src = './assets/test-base.png';
    
  }

  ngAfterViewInit() {
    const ctx = this.canvas.nativeElement.getContext('2d');

    if (ctx) {
      
      this.img.onload = () => {
        this.merchTemplate.onload = () => {
          ctx.drawImage(this.merchTemplate, 0, 0);
          ctx.drawImage(this.img, 100, 100);
        };
      };
      
      this.img.onerror = () => {
        console.error('Failed to load image:', this.img.src);
      };
      
      this.merchTemplate.onerror = () => {
        console.error('Failed to load merch template:', this.merchTemplate.src);
      };

      this.canvas.nativeElement.addEventListener('mousedown', (event) => {
        this.isDragging = true;
        this.startX = event.clientX - this.canvas.nativeElement.offsetLeft;
        this.startY = event.clientY - this.canvas.nativeElement.offsetTop;
      });

      this.canvas.nativeElement.addEventListener('mousemove', (event) => {
        if (this.isDragging) {
          this.x = event.clientX - this.canvas.nativeElement.offsetLeft;
          this.y = event.clientY - this.canvas.nativeElement.offsetTop;
          ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
          ctx.drawImage(this.merchTemplate, 0, 0);
          ctx.drawImage(this.img, this.x - this.startX, this.y - this.startY);
        }
      });
      this.canvas.nativeElement.addEventListener('mouseup', () => {
        this.isDragging = false;
      });
    } else {
      console.error('Failed to get canvas context');
    }
  }
}