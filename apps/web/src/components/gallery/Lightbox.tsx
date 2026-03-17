"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxImage {
  id: number;
  url: string;
  alt: string | null;
}

interface LightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const image = images[currentIndex];
  const hasMultiple = images.length > 1;

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && hasMultiple) {
        goNext();
      } else if (e.key === "ArrowLeft" && hasMultiple) {
        goPrev();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev, hasMultiple]);

  if (!image) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Image lightbox"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/90"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Close lightbox"
        >
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
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image counter */}
        {hasMultiple && (
          <div className="absolute left-4 top-4 z-10 text-sm font-medium text-text-secondary">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Previous button */}
        {hasMultiple && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 p-3 text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {hasMultiple && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 p-3 text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Main image */}
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 mx-16 my-16 max-h-[85vh] max-w-[90vw]"
        >
          <Image
            src={image.url}
            alt={image.alt || "Gallery photo"}
            width={1200}
            height={900}
            className="max-h-[85vh] w-auto object-contain"
            sizes="90vw"
            priority
          />
          {image.alt && (
            <p className="mt-3 text-center text-sm text-text-secondary">
              {image.alt}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
