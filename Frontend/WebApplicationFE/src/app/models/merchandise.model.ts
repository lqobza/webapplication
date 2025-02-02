import { RatingDto } from "./rating.model";
import { Size } from "./size.model";
import { Theme } from "./theme.model";

export interface Merchandise {
    id?: number; // for creating new merchandise
    categoryId: number;
    categoryName: string;
    name: string;
    price: number;
    description: string;
    brandId?: number;
    brandName?: string; // depending on merch
    ratings?: RatingDto[]; // depending on merch
    themes?: Theme[]; // depending on merch
    sizes?: Size[]; // depending on merch
}
