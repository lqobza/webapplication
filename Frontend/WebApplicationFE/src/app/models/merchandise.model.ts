import { RatingDto } from "./rating.model";
import { Size } from "./size.model";
import { Theme } from "./theme.model";
import { MerchandiseImage } from './merchandise-image.model';

export interface Merchandise {
  id?: number; // for creating new merchandise
  categoryId: number;
  categoryName?: string;
  name: string;
  price: number;
  description: string;
  brandId?: number;
  brandName?: string; // depending on merch
  ratings?: any[]; // depending on merch
  themes?: any[]; // depending on merch
  sizes?: any[]; // depending on merch
  imageUrl?: string; // Mock image URL for now
  images: MerchandiseImage[];
}