import type { Metadata } from "next";
import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";
import { getProducts } from "@/lib/api/products";
import { getSiteSettings } from "@/lib/api/site-settings";
import ProductCard from "@/components/product/ProductCard";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: "Shop All",
    description:
      settings?.defaultMetaDescription ??
      "Browse our full collection of premium sauces crafted from a family BBQ recipe.",
  };
}

export default async function ProductsPage() {
  const products = await getProducts();

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
            <li className="text-text-primary">Products</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider md:text-5xl">
            Shop All
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
            Explore our complete range of premium sauces. Bold flavor in every
            bottle.
          </p>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
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
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              No products available
            </h2>
            <p className="mt-2 text-text-secondary">
              We are restocking our shelves. Check back soon for the good
              stuff.
            </p>
            <Link
              href="/"
              className="btn-primary mt-6 inline-flex"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: Product & { images: ProductImage[] }, idx: number) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
