import type { ProductImage } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

/**
 * Format a numeric price as a USD currency string.
 * Accepts both plain numbers and Prisma Decimal values.
 *
 * @example formatPrice(12.99) // "$12.99"
 * @example formatPrice(34)    // "$34.00"
 */
export function formatPrice(price: number | Decimal): string {
  const value = typeof price === "number" ? price : Number(price);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Resolve the best product image URL from an array of ProductImage records.
 *
 * When `primary` is true (default), returns the URL of the image marked
 * `isPrimary`. Falls back to the first image in sort order, or null if the
 * array is empty.
 */
export function getProductImageUrl(
  images: Pick<ProductImage, "url" | "isPrimary">[],
  primary = true,
): string | null {
  if (images.length === 0) return null;

  if (primary) {
    const primaryImage = images.find((img) => img.isPrimary);
    if (primaryImage) return primaryImage.url;
  }

  return images[0]?.url ?? null;
}
