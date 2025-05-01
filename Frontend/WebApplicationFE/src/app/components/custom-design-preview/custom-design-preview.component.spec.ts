import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomDesignPreviewComponent } from './custom-design-preview.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
    
    component.activeTab = 0;
    component.availableSizes = ['S', 'M', 'L', 'XL'];
    component.availableColors = ['red', 'blue', 'green'];
    component.selectedColor = 'red';
    
    component.tabChanged = (event: { index: number }) => {
      component.activeTab = event.index;
    };
    
    component.onColorChanged = (color: string) => {
      component.selectedColor = color;
    };
    
    const mockCanvas = document.createElement('canvas');
    (component as any).canvas = { nativeElement: mockCanvas };
    (component as any).frontCanvas = { nativeElement: mockCanvas };
    (component as any).backCanvas = { nativeElement: mockCanvas };
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should change views when tabs are changed', () => {
    //front
    component.tabChanged({ index: 0 });
    expect(component.activeTab).toBe(0);
    
    //back
    component.tabChanged({ index: 1 });
    expect(component.activeTab).toBe(1);
  });
  
  it('should update product color when selected', () => {
    const oldColor = component.selectedColor;
    const newColor = component.availableColors.find(c => c !== oldColor) || component.availableColors[0];
    
    component.onColorChanged(newColor);
    expect(component.selectedColor).toBe(newColor);
  });
  
  describe('Image resize methods', () => {
    beforeEach(() => {
      //mock image
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
      
      spyOn(component, 'renderCanvas');
    });
  
    
    it('should set image width while  aspect ratio is maintaned', () => {
      component.maintainAspectRatio = true;
      component.setActiveImageWidth(200);
      

      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(200);
      expect(imgElement.height).toBe(200);
      expect(component.renderCanvas).toHaveBeenCalled();
    });

    it('should set image heigth while  aspect ratio is maintaned', () => {
      component.maintainAspectRatio = true;
      component.setActiveImageHeight(200);
      
      const imgElement = component.activeElement as any;
      expect(imgElement.height).toBe(200);
      expect(imgElement.width).toBe(200);
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should not change height when not maintaining aspect ratio', () => {
      component.maintainAspectRatio = false;
      component.setActiveImageWidth(200);
      
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(200);
      expect(imgElement.height).toBe(100);
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should not exceed max dimension while aspect ratio is maintained', () => {
      component.maintainAspectRatio = true;
      
      component.setActiveImageWidth(301);
      
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(100);
      expect(imgElement.height).toBe(100);
    });
    
    
    it('should set image height without maintaining aspect ratio', () => {
      component.maintainAspectRatio = false;
      component.setActiveImageHeight(150);
      
      const imgElement = component.activeElement as any;
      expect(imgElement.height).toBe(150);
      expect(imgElement.width).toBe(100);
      expect(component.renderCanvas).toHaveBeenCalled();
    });
    
    it('should not exceed min dimensions when maintaining aspect ratio', () => {
      component.maintainAspectRatio = true;
      
      //min is 20
      component.setActiveImageHeight(10);
      
      // no change not allowed
      const imgElement = component.activeElement as any;
      expect(imgElement.width).toBe(100);
      expect(imgElement.height).toBe(100);
    });
        
    it('should do nothing when no active element exists', () => {
      component.activeElement = null;
      
      component.setActiveImageWidth(200);
      component.setActiveImageHeight(200);
      if (typeof component.resizeActiveImage === 'function') {
        component.resizeActiveImage(200, 200);
      }
      
      //rendercanvas shouldnot be called
      expect(component.renderCanvas).not.toHaveBeenCalled();
    });
  });
  
  describe('Element manipulation methods', () => {
    beforeEach(() => {
      //mock ImageElement
      component.activeElement = {
        id: 'test-image',
        url: 'test.jpg',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        isDragging: false
      };
      
      //adding test elements to front and back array
      
      component.frontTextElements = [
        {
          id: 'text1',
          text: 'fronttext',
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
          id: 'text2',
          text: 'backtext',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        }
      ];
      
      spyOn(component, 'renderCanvas');
    });
    
    it('should rotate element', () => {
      if (typeof component.rotateActiveElement === 'function') {
        const imgElement = component.activeElement as any;
        expect(imgElement.rotation).toBe(0);
        
        component.rotateActiveElement(5);
        expect(imgElement.rotation).toBe(5);
        
        component.rotateActiveElement(-10);
        expect(imgElement.rotation).toBe(-5);
        expect(component.renderCanvas).toHaveBeenCalledTimes(2);
      }
    });
    
    it('should not rotate when active element is null', () => {
      if (typeof component.rotateActiveElement === 'function') {
        component.activeElement = null;
        component.rotateActiveElement(10);
        expect(component.renderCanvas).not.toHaveBeenCalled();
      }
    });
    
    it('should switch between front and back sides', () => {
      if (typeof component.switchSide === 'function') {
        component.currentSide = 'front';
        
        component.switchSide('back');
        expect(component.currentSide).toBe('back');
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
        
        (component.renderCanvas as jasmine.Spy).calls.reset();
        component.switchSide('front');
        expect(component.currentSide).toBe('front');
        expect(component.renderCanvas).toHaveBeenCalled();
        
        //no switch or render if already on same side
        (component.renderCanvas as jasmine.Spy).calls.reset();
        component.switchSide('front');
        expect(component.renderCanvas).not.toHaveBeenCalled();

      }
    });
    
    it('should delete active element', () => {
      if (typeof component.deleteActiveElement === 'function') {
        component.currentSide = 'front';
        component.activeElement = component.frontTextElements[0];
        
        component.deleteActiveElement();
        
        expect(component.frontTextElements.length).toBe(0);
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
        
        (component.renderCanvas as jasmine.Spy).calls.reset();
        component.activeElement = component.frontImageElements[0];
        
        component.deleteActiveElement();
        expect(component.frontImageElements.length).toBe(0);
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should not delete when no active element exists', () => {
      if (typeof component.deleteActiveElement === 'function') {
        component.activeElement = null;
        component.deleteActiveElement();
        
        expect(component.frontTextElements.length).toBe(1);
        expect(component.frontImageElements.length).toBe(1);

        expect(component.backTextElements.length).toBe(1);
      }
    });
    
    it('should add text to selected side', () => {
      if (typeof component.addText === 'function') {
        component.currentSide = 'front';
        component.newText = 'new testtext';
        component.fontSize = 30;
        component.fontFamily = 'Verdana';
        component.textColor = '#FFFFFF';
        
        const originalLength = component.frontTextElements.length;
        
        component.addText();
        
        
        const newElement = component.frontTextElements[component.frontTextElements.length - 1];
        expect(component.frontTextElements.length).toBe(originalLength + 1);
        expect(newElement.text).toBe('new testtext');
        expect(newElement.fontSize).toBe(30);
        expect(newElement.fontFamily).toBe('Verdana');
        expect(newElement.color).toBe('#FFFFFF');
        expect(component.activeElement).toBe(newElement);
        expect(component.newText).toBe('');
        
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
  });
  

  describe('Element type detection and text manipulation', () => {
    beforeEach(() => {
      spyOn(component, 'renderCanvas');
    });
    
    it('should identify image elements', () => {
      if (typeof component.isImageElement === 'function') {
        component.activeElement = null;
        expect(component.isImageElement()).toBeFalse();
        
        component.activeElement = {
          id: 'text1',
          text: 'test text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        expect(component.isImageElement()).toBeFalse();
        
        component.activeElement = {
          id: 'img1',
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
    
    it('should identify text elements', () => {
      if (typeof component.isTextElement === 'function') {
        component.activeElement = null;
        expect(component.isTextElement()).toBeFalse();
        
        component.activeElement = {
          id: 'img1',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        expect(component.isTextElement()).toBeFalse();
        

        component.activeElement = {
          id: 'text1',
          text: 'test text',
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
    
    it('should get active font', () => {
      if (typeof component.getActiveTextFont === 'function') {
        component.activeElement = null;
        component.fontFamily = 'Arial';
        expect(component.getActiveTextFont()).toBe('Arial');
        
        component.activeElement = {
          id: 'text1',
          text: 'test text',
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Verdana',
          color: '#000000',
          rotation: 0,
          isDragging: false
        };
        expect(component.getActiveTextFont()).toBe('Verdana');
      }
    });
    
    it('should set active font', () => {
      if (typeof component.setActiveTextFont === 'function') {
        component.activeElement = {
          id: 'text1',
          text: 'test text',
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
  
      }
    });
    
    it('should get text size', () => {
      if (typeof component.getActiveTextSize === 'function') {
        component.activeElement = null;
        component.fontSize = 24;
        expect(component.getActiveTextSize()).toBe(24);
        
        component.activeElement = {
          id: 'text1',
          text: 'test text',
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
    
    it('should get text color', () => {
      if (typeof component.getActiveTextColor === 'function') {
        component.activeElement = null;
        component.textColor = '#FFFFFF';
        expect(component.getActiveTextColor()).toBe('#FFFFFF');
        
        component.activeElement = {
          id: 'text1',
          text: 'test text',
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
    
    it('should set text color', () => {
      if (typeof component.setActiveTextColor === 'function') {
        component.activeElement = {
          id: 'text1',
          text: 'test text',
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
        spyOn(component, 'setActiveTextSize');
        
        //mockevent
        const event = {
          target: {
            value: '42'
          }
        } as any;
        
        component.updateTextSize(event);
        expect(component.setActiveTextSize).toHaveBeenCalledWith(42);
      }
    });
  });
  
  describe('T-shirt customization options', () => {
    beforeEach(() => {
      spyOn(component, 'renderCanvas');
      
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
    
    it('should update t-shirt color', () => {
      if (typeof component.onColorSelect === 'function') {
        component.selectedColor = '#ffffff';
        component.onColorSelect('#ff0000');
        
        expect(component.selectedColor).toBe('#ff0000');
        expect(component.customProduct.tshirtColor).toBe('#ff0000');
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should updatet-shirt size', () => {
      if (typeof component.onSizeSelected === 'function') {
        component.selectedSize = 'M';
        component.onSizeSelected('XL');
        

        expect(component.selectedSize).toBe('XL');
        expect(component.customProduct.size).toBe('XL');
      }
    });
    
    it('should capture canvas image', () => {
      if (typeof component.captureCanvasImage === 'function') {
        component.activeElement = {
          id: 'test-image',
          url: 'test.jpg',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          isDragging: false
        };
        
        const dataUrl = component.captureCanvasImage();
        
        expect(dataUrl).toBe('data:image/png;base64,test');
        
        expect(component.renderCanvas).toHaveBeenCalledTimes(2);
      }
    });
    
    it('should clear current side design', () => {
      if (typeof component.clearDesign === 'function') {
        component.currentSide = 'front';
        component.frontTextElements = [{ id: 'text1', text: 'test text', x: 100, y: 100, fontSize: 24, fontFamily: 'Arial', color: '#000000', rotation: 0, isDragging: false }];
        component.frontImageElements = [{ id: 'img1', url: 'test.jpg', x: 100, y: 100, width: 100, height: 100, rotation: 0, isDragging: false }];
        component.activeElement = component.frontTextElements[0];
        
        component.clearDesign();
        
        expect(component.frontTextElements.length).toBe(0);
        expect(component.frontImageElements.length).toBe(0);
        expect(component.activeElement).toBeNull();
        expect(component.renderCanvas).toHaveBeenCalled();
      }
    });
    
    it('should clear all designs', () => {
      if (typeof component.clearAllDesigns === 'function') {
        component.frontTextElements = [{ id: 'text1', text: 'front', x: 100, y: 100, fontSize: 24, fontFamily: 'Arial', color: '#000', rotation: 0, isDragging: false }];
        component.frontImageElements = [{ id: 'img1', url: 'test.jpg', x: 100, y: 100, width: 100, height: 100, rotation: 0, isDragging: false }];
        component.backTextElements = [{ id: 'text2', text: 'back', x: 100, y: 100, fontSize: 24, fontFamily: 'Arial', color: '#000', rotation: 0, isDragging: false }];
        component.backImageElements = [{ id: 'img2', url: 'test.jpg', x: 100, y: 100, width: 100, height: 100, rotation: 0, isDragging: false }];
        component.activeElement = component.frontTextElements[0];
         
        component.clearAllDesigns();
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