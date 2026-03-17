-- CreateTable
CREATE TABLE "Testimonial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "quote" TEXT NOT NULL,
    "imageUrl" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add heroVideoUrl to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "heroVideoUrl" TEXT;

-- AlterTable: Add unique constraint to squareVariationId
CREATE UNIQUE INDEX "Product_squareVariationId_key" ON "Product"("squareVariationId");

-- DropIndex: Replace old Product composite index with new one that includes isFeatured
DROP INDEX "Product_isActive_sortOrder_idx";

-- CreateIndex
CREATE INDEX "Product_isActive_isFeatured_sortOrder_idx" ON "Product"("isActive", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_featured_isActive_sortOrder_idx" ON "Testimonial"("featured", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "GalleryImage_isActive_sortOrder_idx" ON "GalleryImage"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
