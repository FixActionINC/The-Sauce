export interface CartItem {
  productId: number;
  variantId?: number;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
  squareVariationId: string;
  maxStock: number;
}

export interface CheckoutRequest {
  items: CheckoutLineItem[];
}

export interface CheckoutLineItem {
  squareVariationId: string;
  quantity: number;
}

export interface CheckoutResponse {
  url: string;
}
