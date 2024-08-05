export interface Merchandise {
    id?: number; // Optional for creating new merchandise
    categoryId: number;
    name: string;
    inStock: number;
    price: number;
    description: string;
    size: string;
    brandId: number;
    brandName?: string; // Optional, depending on your API response
    ratings?: RatingDto[]; // Optional, depending on your API response
  }
  
  // Optionally, define the RatingDto interface if it is used in the Merchandise model
  export interface RatingDto {
    id: number;
    merchId: number;
    rating: number;
    description: string;
    createdAt: Date;
  }
  