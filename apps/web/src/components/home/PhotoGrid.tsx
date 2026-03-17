"use client";

import Image from "next/image";
import { StaggerContainer, AnimatedCard } from "@/components/motion";

interface GalleryImage {
  id: number;
  url: string;
  alt: string | null;
}

export function PhotoGrid({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-10 text-center font-heading text-3xl font-bold uppercase tracking-wider md:text-4xl">
          The Sauce in Action
        </h2>

        <StaggerContainer className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:gap-3">
          {images.map((image) => (
            <AnimatedCard key={image.id} className="group relative overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.alt || "The Sauce lifestyle photo"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                {/* Hover overlay with brand accent */}
                <div className="absolute inset-0 bg-brand-red/0 transition-colors duration-300 group-hover:bg-brand-red/20" />
              </div>
            </AnimatedCard>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
