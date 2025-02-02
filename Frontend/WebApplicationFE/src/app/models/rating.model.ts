export interface RatingDto {
    id?: number; // for fetching ratings
    merchId: number;
    rating: number;
    description: string;
    createdAt?: Date; // for fetching ratings
}
  