import { MerchandiseImage } from './merchandise-image.model';

export interface Merchandise {
  id?: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  price: number;
  description: string;
  brandId?: number;
  brandName?: string;
  ratings?: any[];
  themes?: any[];
  sizes?: any[];
  imageUrl?: string;
  images: MerchandiseImage[];
}