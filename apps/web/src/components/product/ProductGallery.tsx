"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  id: number;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  // Default to the primary image, or the first one
  const defaultIndex = Math.max(
    images.findIndex((img) => img.isPrimary),
    0,
  );
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  // No images -- show placeholder
  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative aspect-[4/5] overflow-hidden bg-surface-elevated"
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 bg-surface-overlay" />
          <span className="text-sm text-text-secondary">No Image Available</span>
        </div>
      </motion.div>
    );
  }

  const activeImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-elevated">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? productName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail Strip -- only if more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                idx === selectedIndex
                  ? "ring-2 ring-brand-orange ring-offset-2 ring-offset-surface"
                  : "opacity-60 ring-1 ring-surface-overlay hover:opacity-100"
              }`}
              aria-label={`View ${img.alt ?? `image ${idx + 1}`}`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
