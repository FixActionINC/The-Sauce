import { cache } from "react";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { uploadToS3, deleteFromS3, extractS3Key } from "@/lib/s3";
import { validateImageFile } from "./image.service";

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const getGalleryImages = cache(async () => {
  return db.galleryImage.findMany({
    orderBy: { sortOrder: "asc" },
  });
});

export const getActiveGalleryImages = cache(async () => {
  return db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
});

export const getGalleryImageCount = cache(async () => {
  return db.galleryImage.count();
});

export async function uploadGalleryImage(file: File, alt?: string) {
  const validation = validateImageFile(file);
  if (!validation.ok) throw new Error(validation.error);

  const ext = EXTENSION_MAP[file.type] || "jpg";
  const key = `gallery/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToS3(key, buffer, file.type);

  const count = await db.galleryImage.count();

  return db.galleryImage.create({
    data: {
      url,
      alt: alt || null,
      sortOrder: count,
      isActive: true,
    },
  });
}

export async function deleteGalleryImage(id: number) {
  const image = await db.galleryImage.findUnique({ where: { id } });
  if (!image) throw new Error("Image not found.");

  // DB delete first, then S3 cleanup
  await db.galleryImage.delete({ where: { id } });

  const s3Key = extractS3Key(image.url);
  if (s3Key) {
    try {
      await deleteFromS3(s3Key);
    } catch (err) {
      console.error(`[gallery] Failed to delete S3 object "${s3Key}":`, err);
    }
  }
}
