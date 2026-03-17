import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { uploadToS3, deleteFromS3, extractS3Key, getCdnUrl } from "@/lib/s3";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageUploadResult {
  id: number;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateImageFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP, AVIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`,
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload a product image to S3 and create a ProductImage record.
 *
 * Images are stored at `products/{productId}/{uuid}.{ext}` in S3.
 * The CDN URL is persisted as the image `url` in the database.
 */
export async function uploadProductImage(
  productId: number,
  file: File,
  alt?: string,
): Promise<ImageUploadResult> {
  const validation = validateImageFile(file);
  if (!validation.ok) throw new Error(validation.error);

  const ext = EXTENSION_MAP[file.type] || "jpg";
  const key = `products/${productId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToS3(key, buffer, file.type);

  // Check if this is the first image for the product (make it primary)
  const existingCount = await db.productImage.count({
    where: { productId },
  });

  const image = await db.productImage.create({
    data: {
      url,
      alt: alt || null,
      isPrimary: existingCount === 0,
      sortOrder: existingCount,
      productId,
    },
  });

  return {
    id: image.id,
    url: image.url,
    alt: image.alt,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
  };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a product image from S3 and remove the database record.
 * If the deleted image was primary, promotes the next image.
 */
export async function deleteProductImage(imageId: number): Promise<void> {
  const image = await db.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) throw new Error("Image not found.");

  // 1. DB operations first (critical) -- delete record and promote new
  //    primary if needed, all within a single transaction.
  await db.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextImage = await tx.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { sortOrder: "asc" },
      });

      if (nextImage) {
        await tx.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  // 2. S3 cleanup (non-critical) -- if this fails, the file is orphaned
  //    but the DB is consistent.
  const s3Key = extractS3Key(image.url);
  if (s3Key) {
    try {
      await deleteFromS3(s3Key);
    } catch (err) {
      console.error(`[image.service] Failed to delete S3 object "${s3Key}" (orphaned):`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Set Primary
// ---------------------------------------------------------------------------

/**
 * Set an image as the primary image for its product.
 * Unsets the current primary image first.
 */
export async function setPrimaryImage(imageId: number): Promise<void> {
  const image = await db.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) throw new Error("Image not found.");

  await db.$transaction([
    db.productImage.updateMany({
      where: { productId: image.productId, isPrimary: true },
      data: { isPrimary: false },
    }),
    db.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Reorder
// ---------------------------------------------------------------------------

/**
 * Update sort order for a list of image IDs.
 */
export async function reorderImages(
  imageIds: number[],
): Promise<void> {
  const updates = imageIds.map((id, index) =>
    db.productImage.update({
      where: { id },
      data: { sortOrder: index },
    }),
  );

  await db.$transaction(updates);
}

// ---------------------------------------------------------------------------
// Get images for product
// ---------------------------------------------------------------------------

export async function getProductImages(productId: number) {
  return db.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
}
