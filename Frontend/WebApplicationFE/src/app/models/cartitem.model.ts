export interface CartItem {
    id?: number | string;
    orderId?: number;
    merchandiseName?: string;
    name: string;
    merchId: number;
    size: string;
    quantity: number;
    price: number;
    imageUrl?: string;
    frontImage?: string;
    backImage?: string;
    isCustom?: boolean;
    stockWarning?: boolean;
    availableStock?: number;
}
