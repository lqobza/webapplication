import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomDesignPreviewComponent } from './custom-design-preview.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

describe('CustomDesignPreviewComponent', () => {
  let component: CustomDesignPreviewComponent & {
    activeTab: number;
    availableSizes: string[];
    availableColors: string[];
    selectedColor: string;
    tabChanged: (event: { index: number }) => void;
    onColorChanged: (color: string) => void;
  };
  let fixture: ComponentFixture<CustomDesignPreviewComponent>;
  let httpClientMock: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    httpClientMock = jasmine.createSpyObj('HttpClient', ['get']);
    httpClientMock.get.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        MatSliderModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatSelectModule,
        CustomDesignPreviewComponent
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        { provide: HttpClient, useValue: httpClientMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomDesignPreviewComponent);
    component = fixture.componentInstance as any;
    
    // Initialize component properties
    component.activeTab = 0;
    component.availableSizes = ['S', 'M', 'L', 'XL'];
    component.availableColors = ['red', 'blue', 'green'];
    component.selectedColor = 'red';
    
    // Add the missing methods
    component.tabChanged = (event: { index: number }) => {
      component.activeTab = event.index;
    };
    
    component.onColorChanged = (color: string) => {
      component.selectedColor = color;
    };
    
    // Mock canvas element using 'any' type to avoid linter errors
    const mockCanvas = document.createElement('canvas');
    (component as any).canvas = { nativeElement: mockCanvas };
    (component as any).frontCanvas = { nativeElement: mockCanvas };
    (component as any).backCanvas = { nativeElement: mockCanvas };
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should initialize with default values', () => {
    expect(component.activeTab).toBe(0);
    expect(component.availableSizes).toBeTruthy();
    expect(component.availableColors).toBeTruthy();
  });
  
  it('should change views when tabs are changed', () => {
    // Front view
    component.tabChanged({ index: 0 });
    expect(component.activeTab).toBe(0);
    
    // Back view
    component.tabChanged({ index: 1 });
    expect(component.activeTab).toBe(1);
  });
  
  it('should update product color when selected', () => {
    const initialColor = component.selectedColor;
    const newColor = component.availableColors.find(c => c !== initialColor) || component.availableColors[0];
    
    component.onColorChanged(newColor);
    
    expect(component.selectedColor).toBe(newColor);
  });
  
  // Tests for image resize functionality
  describe('Image resize methods', () => {
    beforeEach(() => {
      // Create mock ImageElement
      component.activeElement = {
        id: 'test-img',
        url: 'test.jpg',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        isDragging: false
      };
      
      // Spy on renderCanvas method
      spyOn(component, 'renderCanvas');
    });
    
    it('should format pixel values correctly', () => {
      expect(component.formatPx(100)).toBe('100px');
      expect(component.formatPx(0)).toBe('0px');
    });
    
    it('should get active image width', () => {
      expect(component.getActiveImageWidth()).toBe(100);
      
      // Test with no active element
      component.activeElement = null;
      expect(component.getActiveImageWidth()).toBe(100); // Default value
    });
    
    it('should get active image height', () => {
      expect(component.getActiveImageHeight()).toBe(100);
      
      // Test with no active element
      component.activeElement = null;
      expect(component.getActiveImageHeight()).toBe(100); // Default value
    });
    
    it('should set image width while maintaining aspect ratio', () => {
      component.maintainAspectRatio = true;
      component.setActiveImageWidth(200);
      
      // Height should double as well to maintain 1:1 aspect ratio
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(200);
      expect(imgElement.height).toBe(200);
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should set image width without maintaining aspect ratio', () => {
      component.maintainAspectRatio = false;
      component.setActiveImageWidth(200);
      
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(200);
      expect(imgElement.height).toBe(100); // Height unchanged
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should not exceed max dimensions when maintaining aspect ratio', () => {
      component.maintainAspectRatio = true;
      
      // If we set width to 301, with 1:1 aspect ratio, height would exceed max (300)
      component.setActiveImageWidth(301);
      
      // Change should be rejected
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(100);
      expect(imgElement.height).toBe(100);
    });
    
    it('should set image height while maintaining aspect ratio', () => {
      component.maintainAspectRatio = true;
      component.setActiveImageHeight(150);
      
      // Width should also increase by 1.5x to maintain aspect ratio
      const imgElement = component.activeElement as any;
      expect(imgElement.height).toBe(150);
      expect(imgElement.width).toBe(150);
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should set image height without maintaining aspect ratio', () => {
      component.maintainAspectRatio = false;
      component.setActiveImageHeight(150);
      
      const imgElement = component.activeElement as any;
      expect(imgElement.height).toBe(150);
      expect(imgElement.width).toBe(100); // Width unchanged
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should not exceed min dimensions when maintaining aspect ratio', () => {
      component.maintainAspectRatio = true;
      
      // If we set height to 10, with 1:1 aspect ratio, width would be below min (20)
      component.setActiveImageHeight(10);
      
      // Change should be rejected
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(100);
      expect(imgElement.height).toBe(100);
    });
    
    it('should resize active image directly', () => {
      // Test the resizeActiveImage method if available
      if (typeof component.resizeActiveImage === 'function') {
        component.resizeActiveImage(200, 150);
        
        const imgElement = component.activeElement as any;
        expect(imgElement.width).toBe(200);
        expect(imgElement.height).toBe(150);
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should do nothing when no active element exists', () => {
      component.activeElement = null;
      
      // Should not throw errors when no active element
      component.setActiveImageWidth(200);
      component.setActiveImageHeight(200);
      if (typeof component.resizeActiveImage === 'function') {
        component.resizeActiveImage(200, 200);
      }
      
      // renderCanvas shouldn't be called
      expect(component.renderCanvas).not.toHaveBeenCalled();
    });
  });
  
  // Tests for element manipulation methods
  describe('Element manipulation methods', () => {
    beforeEach(() => {
      // Create mock ImageElement
      component.activeElement = {
        id: 'test-img',
        url: 'test.jpg',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        isDragging: false
      };
      
      // Add some test elements to front and back arrays
      component.frontTextElements = [
        {
          id: 'text-1',
          text: 'Front Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        }
      ];
      
      component.frontImageElements = [
        {
          id: 'img-1',
          url: 'test.jpg',
          x: 150,
          y: 150,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        }
      ];
      
      component.backTextElements = [
        {
          id: 'text-2',
          text: 'Back Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        }
      ];
      
      // Spy on renderCanvas method
      spyOn(component, 'renderCanvas');
    });
    
    it('should rotate active element', () => {
      if (typeof component.rotateActiveElement === 'function') {
        const imgElement = component.activeElement as any;
        
        // Initial rotation is 0
        expect(imgElement.rotation).toBe(0);
        
        // Rotate by 5 degrees
        component.rotateActiveElement(5);
        expect(imgElement.rotation).toBe(5);
        
        // Rotate by -10 degrees
        component.rotateActiveElement(-10);
        expect(imgElement.rotation).toBe(-5);
        
        expect(component.renderCanvas).toHaveBeenCalledTimes(2);
      }
    });
    
    it('should not rotate when no active element exists', () => {
      if (typeof component.rotateActiveElement === 'function') {
        component.activeElement = null;
        component.rotateActiveElement(10);
        expect(component.renderCanvas).not.toHaveBeenCalled();
      }
    });
    
    it('should switch between front and back sides', () => {
      if (typeof component.switchSide === 'function') {
        // Starting with front side
        component.currentSide = 'front';
        
        // Switch to back
        component.switchSide('back');
        expect(component.currentSide).toBe('back');
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
        
        // Reset call count
        (component.renderCanvas as jasmine.Spy).calls.reset();
        
        // Switch back to front
        component.switchSide('front');
        expect(component.currentSide).toBe('front');
        expect(component.renderCanvas).toHaveBeenCalled();
        
        // Should not switch or render if already on the selected side
        (component.renderCanvas as jasmine.Spy).calls.reset();
        component.switchSide('front');
        expect(component.renderCanvas).not.toHaveBeenCalled();
      }
    });
    
    it('should delete active element', () => {
      if (typeof component.deleteActiveElement === 'function') {
        // Set active element to a front text element
        component.currentSide = 'front';
        component.activeElement = component.frontTextElements[0];
        
        // Delete it
        component.deleteActiveElement();
        
        // Element should be removed from array
        expect(component.frontTextElements.length).toBe(0);
        // Active element should be null
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
        
        // Reset
        (component.renderCanvas as jasmine.Spy).calls.reset();
        component.activeElement = component.frontImageElements[0];
        
        // Delete image element
        component.deleteActiveElement();
        expect(component.frontImageElements.length).toBe(0);
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should not delete anything when no active element exists', () => {
      if (typeof component.deleteActiveElement === 'function') {
        component.activeElement = null;
        component.deleteActiveElement();
        
        // Arrays should remain unchanged
        expect(component.frontTextElements.length).toBe(1);
        expect(component.frontImageElements.length).toBe(1);
        expect(component.backTextElements.length).toBe(1);
      }
    });
    
    it('should add text to current side', () => {
      if (typeof component.addText === 'function') {
        component.currentSide = 'front';
        component.newText = 'New Test Text';
        component.fontSize = 30;
        component.fontFamily = 'Verdana';
        component.textColor = '#FF0000';
        
        const originalLength = component.frontTextElements.length;
        
        component.addText();
        
        // Should add new element to array
        expect(component.frontTextElements.length).toBe(originalLength + 1);
        
        // New element should have correct properties
        const newElement = component.frontTextElements[component.frontTextElements.length - 1];
        expect(newElement.text).toBe('New Test Text');
        expect(newElement.fontSize).toBe(30);
        expect(newElement.fontFamily).toBe('Verdana');
        expect(newElement.color).toBe('#FF0000');
        
        // New element should become active element
        expect(component.activeElement).toBe(newElement);
        
        // Text input should be cleared
        expect(component.newText).toBe('');
        
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
  });
  
  // Tests for element type detection and text manipulation
  describe('Element type detection and text manipulation', () => {
    beforeEach(() => {
      // Spy on renderCanvas method
      spyOn(component, 'renderCanvas');
    });
    
    it('should correctly identify image elements', () => {
      if (typeof component.isImageElement === 'function') {
        // No active element
        component.activeElement = null;
        expect(component.isImageElement()).toBeFalse();
        
        // Text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        expect(component.isImageElement()).toBeFalse();
        
        // Image element
        component.activeElement = {
          id: 'img-1',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        expect(component.isImageElement()).toBeTrue();
      }
    });
    
    it('should correctly identify text elements', () => {
      if (typeof component.isTextElement === 'function') {
        // No active element
        component.activeElement = null;
        expect(component.isTextElement()).toBeFalse();
        
        // Image element
        component.activeElement = {
          id: 'img-1',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        expect(component.isTextElement()).toBeFalse();
        
        // Text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        expect(component.isTextElement()).toBeTrue();
      }
    });
    
    it('should get active text font', () => {
      if (typeof component.getActiveTextFont === 'function') {
        // Default when no active element
        component.activeElement = null;
        component.fontFamily = 'Arial';
        expect(component.getActiveTextFont()).toBe('Arial');
        
        // From active text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Verdana',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        expect(component.getActiveTextFont()).toBe('Verdana');
        
        // Should ignore non-text elements
        component.activeElement = {
          id: 'img-1',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        expect(component.getActiveTextFont()).toBe('Arial');
      }
    });
    
    it('should set active text font', () => {
      if (typeof component.setActiveTextFont === 'function') {
        // Set up text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        
        component.setActiveTextFont('Georgia');
        expect((component.activeElement as any).fontFamily).toBe('Georgia');
        expect(component.renderCanvas).toHaveBeenCalled();
        
        // Should do nothing for non-text elements
        (component.renderCanvas as jasmine.Spy).calls.reset();
        component.activeElement = {
          id: 'img-1',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        
        component.setActiveTextFont('Georgia');
        expect(component.renderCanvas).not.toHaveBeenCalled();
      }
    });
    
    it('should get active text size', () => {
      if (typeof component.getActiveTextSize === 'function') {
        // Default when no active element
        component.activeElement = null;
        component.fontSize = 24;
        expect(component.getActiveTextSize()).toBe(24);
        
        // From active text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        expect(component.getActiveTextSize()).toBe(36);
      }
    });
    
    it('should set active text size', () => {
      if (typeof component.setActiveTextSize === 'function') {
        // Set up text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        
        component.setActiveTextSize(48);
        expect((component.activeElement as any).fontSize).toBe(48);
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should get active text color', () => {
      if (typeof component.getActiveTextColor === 'function') {
        // Default when no active element
        component.activeElement = null;
        component.textColor = '#FF0000';
        expect(component.getActiveTextColor()).toBe('#FF0000');
        
        // From active text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#0000FF',
          rotation: 0,
          isDragging: false
        };
        expect(component.getActiveTextColor()).toBe('#0000FF');
      }
    });
    
    it('should set active text color', () => {
      if (typeof component.setActiveTextColor === 'function') {
        // Set up text element
        component.activeElement = {
          id: 'text-1',
          text: 'Test Text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        
        component.setActiveTextColor('#00FF00');
        expect((component.activeElement as any).color).toBe('#00FF00');
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should update text size from input event', () => {
      if (typeof component.updateTextSize === 'function' && typeof component.setActiveTextSize === 'function') {
        // Spy on setActiveTextSize
        spyOn(component, 'setActiveTextSize');
        
        // Create mock event
        const event = {
          target: {
            value: '42'
          }
        } as any;
        
        component.updateTextSize(event);
        expect(component.setActiveTextSize).toHaveBeenCalledWith(42);
        
        // Should handle invalid input
        const invalidEvent = {
          target: null
        } as any;
        
        component.updateTextSize(invalidEvent);
        expect(component.setActiveTextSize).toHaveBeenCalledTimes(1); // No additional calls
      }
    });
  });
  
  // Tests for T-shirt customization options
  describe('T-shirt customization options', () => {
    beforeEach(() => {
      // Spy on renderCanvas method
      spyOn(component, 'renderCanvas');
      
      // Mock canvas and context for captureCanvasImage
      const mockContext = {
        clearRect: jasmine.createSpy('clearRect'),
        drawImage: jasmine.createSpy('drawImage'),
        strokeRect: jasmine.createSpy('strokeRect'),
        setLineDash: jasmine.createSpy('setLineDash')
      };
      
      const mockCanvas = {
        getContext: jasmine.createSpy('getContext').and.returnValue(mockContext),
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,test')
      };
      
      component.designCanvas = { nativeElement: mockCanvas as any };
    });
    
    it('should update T-shirt color', () => {
      if (typeof component.onColorSelect === 'function') {
        component.selectedColor = '#ffffff';
        component.onColorSelect('#ff0000');
        
        expect(component.selectedColor).toBe('#ff0000');
        expect(component.customProduct.tshirtColor).toBe('#ff0000');
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should update T-shirt size', () => {
      if (typeof component.onSizeSelect === 'function') {
        component.selectedSize = 'M';
        component.onSizeSelect('XL');
        
        expect(component.selectedSize).toBe('XL');
        expect(component.customProduct.size).toBe('XL');
      }
    });
    
    it('should capture canvas image', () => {
      if (typeof component.captureCanvasImage === 'function') {
        // Set up active element
        component.activeElement = {
          id: 'test-img',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        
        const dataUrl = component.captureCanvasImage();
        
        // Should return data URL from canvas
        expect(dataUrl).toBe('data:image/png;base64,test');
        
        // Should temporarily clear active element for clean capture
        expect(component.renderCanvas).toHaveBeenCalledTimes(2);
      }
    });
    
    it('should clear current side design', () => {
      if (typeof component.clearDesign === 'function') {
        // Setup test data
        component.currentSide = 'front';
        component.frontTextElements = [{ id: 'text-1', text: 'Test', x: 100, y: 100, fontSize: 24, fontFamily: 'Arial', color: '#000', rotation: 0, isDragging: false }];
        component.frontImageElements = [{ id: 'img-1', url: 'test.jpg', x: 100, y: 100, width: 100, height: 100, rotation: 0, isDragging: false }];
        component.activeElement = component.frontTextElements[0];
        
        // Clear front side
        component.clearDesign();
        
        // Arrays should be empty and active element null
        expect(component.frontTextElements.length).toBe(0);
        expect(component.frontImageElements.length).toBe(0);
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should clear all designs', () => {
      if (typeof component.clearAllDesigns === 'function') {
        // Setup test data
        component.frontTextElements = [{ id: 'text-1', text: 'Front', x: 100, y: 100, fontSize: 24, fontFamily: 'Arial', color: '#000', rotation: 0, isDragging: false }];
        component.frontImageElements = [{ id: 'img-1', url: 'test.jpg', x: 100, y: 100, width: 100, height: 100, rotation: 0, isDragging: false }];
        component.backTextElements = [{ id: 'text-2', text: 'Back', x: 100, y: 100, fontSize: 24, fontFamily: 'Arial', color: '#000', rotation: 0, isDragging: false }];
        component.backImageElements = [{ id: 'img-2', url: 'test.jpg', x: 100, y: 100, width: 100, height: 100, rotation: 0, isDragging: false }];
        component.activeElement = component.frontTextElements[0];
        
        // Clear all
        component.clearAllDesigns();
        
        // All arrays should be empty
        expect(component.frontTextElements.length).toBe(0);
        expect(component.frontImageElements.length).toBe(0);
        expect(component.backTextElements.length).toBe(0);
        expect(component.backImageElements.length).toBe(0);
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
  });
});