import { RatingDto } from "./rating.model";

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
