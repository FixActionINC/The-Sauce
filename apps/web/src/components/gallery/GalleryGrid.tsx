"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lightbox } from "./Lightbox";

interface GalleryImage {
  id: number;
  url: string;
  alt: string | null;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:gap-3"
      >
        {images.map((image, index) => (
          <motion.button
            key={image.id}
            variants={itemVariants}
            onClick={() => setLightboxIndex(index)}
            className="group relative cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label={`View ${image.alt || "gallery photo"} full size`}
          >
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.alt || "Gallery photo"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-brand-red/0 transition-colors duration-300 group-hover:bg-brand-red/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
