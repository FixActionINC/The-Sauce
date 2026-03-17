import { cache } from "react";
import { db } from "@/lib/db";
import { deleteFromS3, extractS3Key } from "@/lib/s3";

// ---------------------------------------------------------------------------
// Shared include clause
// ---------------------------------------------------------------------------

const withImages = {
  images: { orderBy: { sortOrder: "asc" as const } },
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductCreateData {
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  squareCatalogId?: string | null;
  squareVariationId?: string | null;
  ingredients?: string | null;
  features?: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: string;
  sortOrder: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  servingSize?: string | null;
  calories?: number | null;
  totalFat?: string | null;
  sodium?: string | null;
  totalCarbs?: string | null;
  sugars?: string | null;
  protein?: string | null;
}

export type ProductUpdateData = ProductCreateData;

// ---------------------------------------------------------------------------
// Queries (cached for RSC deduplication)
// ---------------------------------------------------------------------------

/**
 * Fetch all active products, ordered by sortOrder then newest first.
 */
export const getProducts = cache(async () => {
  return db.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: withImages,
  });
});

/**
 * Fetch active + featured products, ordered by sortOrder then newest first.
 */
export const getFeaturedProducts = cache(async () => {
  return db.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: withImages,
  });
});

/**
 * Fetch a single product by its unique slug.
 * Returns null if not found or inactive.
 */
export const getProductBySlug = cache(async (slug: string) => {
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: withImages,
  });
});

/**
 * Return an array of `{ slug }` objects suitable for `generateStaticParams`.
 */
export async function getProductSlugs(): Promise<{ slug: string }[]> {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return products.map((p: { slug: string }) => ({ slug: p.slug }));
}

/**
 * Fetch active products excluding a given product ID.
 * Useful for "You May Also Like" sections.
 */
export const getRelatedProducts = cache(
  async (excludeId: number, limit = 3) => {
    return db.product.findMany({
      where: { isActive: true, id: { not: excludeId } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: withImages,
    });
  },
);

/**
 * Fetch all products (active and inactive) for admin listings.
 * Includes only the primary image for table thumbnails.
 */
export async function getAllProductsForAdmin() {
  return db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
}

/**
 * Fetch a single product by internal ID (admin use -- includes inactive).
 */
export async function getProductById(id: number) {
  return db.product.findUnique({ where: { id } });
}

/**
 * Fetch a single product by ID with its images (admin use).
 */
export async function getProductByIdWithImages(id: number) {
  return db.product.findUnique({
    where: { id },
    include: withImages,
  });
}

/**
 * Count all products (active and inactive).
 */
export const getProductCount = cache(async () => {
  return db.product.count();
});

/**
 * Count only active products.
 */
export const getActiveProductCount = cache(async () => {
  return db.product.count({ where: { isActive: true } });
});

/**
 * Sum total stock across all products.
 */
export const getTotalInventory = cache(async () => {
  const result = await db.product.aggregate({ _sum: { stock: true } });
  return result._sum.stock ?? 0;
});

/**
 * Check if a slug is already taken, optionally excluding a product by ID.
 */
export async function isSlugTaken(
  slug: string,
  excludeId?: number,
): Promise<boolean> {
  const where = excludeId
    ? { slug, id: { not: excludeId } }
    : { slug };

  const existing = await db.product.findFirst({ where });
  return existing !== null;
}

// ---------------------------------------------------------------------------
// Checkout verification
// ---------------------------------------------------------------------------

/**
 * Verify products exist, are active, and have sufficient stock for checkout.
 * Takes a Map of squareVariationId -> requested quantity.
 *
 * Returns an object with verified products or error details.
 */
export async function verifyCheckoutProducts(
  items: Map<string, number>,
): Promise<VerifyCheckoutResult> {
  const variationIds = Array.from(items.keys());

  const products = await db.product.findMany({
    where: { squareVariationId: { in: variationIds } },
    select: {
      id: true,
      name: true,
      price: true,
      squareVariationId: true,
      stock: true,
      isActive: true,
    },
  });

  type VerifyProduct = (typeof products)[number];
  const productByVariationId = new Map<string | null, VerifyProduct>(
    products.map((p) => [p.squareVariationId, p]),
  );

  const unavailable: string[] = [];
  const insufficientStock: StockError[] = [];

  for (const [variationId, quantity] of items) {
    const product = productByVariationId.get(variationId);

    if (!product || !product.isActive) {
      unavailable.push(product?.name ?? variationId);
      continue;
    }

    if (product.stock < quantity) {
      insufficientStock.push({
        name: product.name,
        available: product.stock,
        requested: quantity,
      });
    }
  }

  if (unavailable.length > 0 || insufficientStock.length > 0) {
    return { ok: false, unavailable, insufficientStock };
  }

  return { ok: true, products };
}

export interface StockError {
  name: string;
  available: number;
  requested: number;
}

export type VerifyCheckoutResult =
  | {
      ok: true;
      products: {
        id: number;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        squareVariationId: string | null;
        stock: number;
        isActive: boolean;
      }[];
    }
  | {
      ok: false;
      unavailable: string[];
      insufficientStock: StockError[];
    };

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new product.
 */
export async function createProduct(data: ProductCreateData) {
  return db.product.create({ data });
}

/**
 * Update an existing product by ID.
 */
export async function updateProduct(id: number, data: ProductUpdateData) {
  return db.product.update({ where: { id }, data });
}

/**
 * Delete a product by ID (cascades to images).
 */
export async function deleteProduct(id: number) {
  // Fetch associated images so we can clean up S3 objects
  const images = await db.productImage.findMany({
    where: { productId: id },
    select: { url: true },
  });

  // Best-effort S3 cleanup before DB delete
  for (const image of images) {
    const s3Key = extractS3Key(image.url);
    if (s3Key) {
      try {
        await deleteFromS3(s3Key);
      } catch (err) {
        console.error(`Failed to delete S3 object "${s3Key}":`, err);
      }
    }
  }

  return db.product.delete({ where: { id } });
}

/**
 * Atomically decrement stock for a product identified by squareVariationId.
 * Only decrements if current stock >= quantity to prevent going negative.
 */
export async function decrementStock(
  squareVariationId: string,
  quantity: number,
) {
  return db.product.updateMany({
    where: {
      squareVariationId,
      stock: { gte: quantity },
    },
    data: {
      stock: { decrement: quantity },
    },
  });
}

/**
 * Atomically decrement stock for a product identified by its database ID.
 * Only decrements if current stock >= quantity to prevent going negative.
 */
export async function decrementStockById(
  productId: number,
  quantity: number,
) {
  return db.product.updateMany({
    where: {
      id: productId,
      stock: { gte: quantity },
    },
    data: {
      stock: { decrement: quantity },
    },
  });
}
