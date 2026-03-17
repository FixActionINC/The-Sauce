import type { Metadata } from "next";
import Link from "next/link";
import { getActiveGalleryImages } from "@/lib/api/gallery";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "See The Sauce by Tyrone Jones in action. Photos of our premium BBQ sauces, cookouts, and community.",
  openGraph: {
    title: "Gallery | The Sauce by Tyrone Jones",
    description:
      "See The Sauce by Tyrone Jones in action. Photos of our premium BBQ sauces, cookouts, and community.",
  },
};

export default async function GalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <main className="section-padding min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-text-secondary">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-brand-orange"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </li>
            <li className="text-text-primary">Gallery</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider md:text-5xl">
            Gallery
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
            The Sauce in action. From backyard cookouts to family tables, see how
            people bring the flavor.
          </p>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center bg-surface-elevated">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-secondary"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              No photos yet
            </h2>
            <p className="mt-2 text-text-secondary">
              We are building our gallery. Check back soon for photos of The
              Sauce in action.
            </p>
            <Link href="/" className="btn-primary mt-6 inline-flex">
              Back to Home
            </Link>
          </div>
        ) : (
          <GalleryGrid images={images} />
        )}
      </div>
    </main>
  );
}
