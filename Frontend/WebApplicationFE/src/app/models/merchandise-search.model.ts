export interface MerchandiseSearch {
  keywords?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  sortBy?: SortOption;
  page: number;
  pageSize: number;
}

export enum SortOption {
  NameAsc = 'NameAsc',
  NameDesc = 'NameDesc',
  PriceAsc = 'PriceAsc',
  PriceDesc = 'PriceDesc'
} 