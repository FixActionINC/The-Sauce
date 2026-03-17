/**
 * Product data-access layer -- re-exports from the centralized service.
 *
 * Existing consumers can continue importing from `@/lib/api/products`
 * without changes. All database logic lives in the service module.
 */
export {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/services/product.service";
