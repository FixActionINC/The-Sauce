export interface Product {
  id: number;
  name: string;
  slug: string;
  tagline?: string;
  description?: string; // HTML string
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  squareCatalogId?: string;
  squareVariationId?: string;
  images: ProductImage[];
  ingredients?: string;
  features?: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: ProductCategory;
  sortOrder: number;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Nutrition
  nutritionInfo?: NutritionInfo;

  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = "original" | "hot" | "mild" | "limited-edition" | "bundle";

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface NutritionInfo {
  servingSize?: string;
  calories?: number;
  totalFat?: string;
  sodium?: string;
  totalCarbs?: string;
  sugars?: string;
  protein?: string;
}
