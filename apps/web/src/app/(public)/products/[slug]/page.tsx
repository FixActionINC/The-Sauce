import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Product, ProductImage } from "@prisma/client";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/api/products";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import ProductGallery from "@/components/product/ProductGallery";
import ProductCard from "@/components/product/ProductCard";
import AddToCartSection from "@/components/product/AddToCartSection";
import FeatureList from "@/components/product/FeatureList";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    return await getProductSlugs();
  } catch {
    // If DB is unavailable at build time, return empty array.
    // Pages will be generated on-demand via ISR.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.metaTitle ?? product.name,
    description:
      product.metaDescription ??
      product.shortDescription ??
      `${product.name} -- premium sauce from The Sauce by Tyrone Jones.`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Parse features from JSON string array
  let features: string[] = [];
  if (product.features) {
    try {
      features = JSON.parse(product.features) as string[];
    } catch {
      features = [product.features];
    }
  }

  const hasNutrition =
    product.servingSize ||
    product.calories !== null ||
    product.totalFat ||
    product.sodium ||
    product.totalCarbs ||
    product.sugars ||
    product.protein;

  // Fetch related products for the "You May Also Like" section
  const relatedProducts = await getRelatedProducts(product.id, 3);

  const primaryImageUrl = getProductImageUrl(product.images);

  return (
    <main className="section-padding min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(product.name, product.slug)),
        }}
      />
      <div className="mx-auto max-w-6xl">
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
              <ChevronIcon />
            </li>
            <li>
              <Link
                href="/products"
                className="transition-colors hover:text-brand-orange"
              >
                Products
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronIcon />
            </li>
            <li className="truncate text-text-primary">{product.name}</li>
          </ol>
        </nav>

        {/* Product Layout: Gallery + Info */}
        <div className="grid gap-12 md:grid-cols-2">
          {/* Left Column: Gallery */}
          <div>
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Right Column: Product Info */}
          <div>
            <div className="flex flex-col justify-center">
              {/* Tagline */}
              {product.tagline && (
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
                  {product.tagline}
                </p>
              )}

              {/* Name */}
              <h1 className="font-heading mt-2 text-3xl font-bold md:text-4xl lg:text-5xl">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-5 flex items-baseline gap-3">
                <p className="text-3xl font-bold text-brand-gold">
                  {formatPrice(product.price)}
                </p>
                {product.compareAtPrice !== null &&
                  product.compareAtPrice > product.price && (
                    <p className="text-lg text-text-secondary line-through">
                      {formatPrice(product.compareAtPrice)}
                    </p>
                  )}
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="mt-4 text-base leading-relaxed text-text-secondary">
                  {product.shortDescription}
                </p>
              )}

              {/* Description (HTML) */}
              {product.description && (
                <div
                  className="prose prose-invert mt-6 max-w-none text-text-secondary prose-strong:text-text-primary"
                  dangerouslySetInnerHTML={{ __html: sanitize(product.description) }}
                />
              )}

              {/* Features */}
              <FeatureList features={features} />

              {/* Add to Cart */}
              <AddToCartSection
                inStock={product.stock > 0}
                productId={product.id}
                productName={product.name}
                price={Number(product.price)}
                image={primaryImageUrl ?? ""}
                squareVariationId={product.squareVariationId ?? ""}
                stock={product.stock}
              />

              {/* Product Details Table */}
              <div className="mt-8 space-y-3 border-t border-surface-overlay pt-8">
                {product.ingredients && (
                  <div className="border border-surface-overlay bg-surface-elevated p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                      Ingredients
                    </h3>
                    <p className="text-sm leading-relaxed text-text-primary">
                      {product.ingredients}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {product.category && (
                    <div className="border border-surface-overlay bg-surface-elevated p-3">
                      <span className="block text-xs text-text-secondary">
                        Category
                      </span>
                      <span className="mt-1 block text-sm font-medium capitalize text-text-primary">
                        {product.category}
                      </span>
                    </div>
                  )}
                  <div className="border border-surface-overlay bg-surface-elevated p-3">
                    <span className="block text-xs text-text-secondary">
                      Availability
                    </span>
                    {product.stock > 0 ? (
                      <span className="mt-1 block text-sm font-medium text-green-500">
                        In Stock
                      </span>
                    ) : (
                      <span className="mt-1 block text-sm font-medium text-brand-red">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Facts */}
        {hasNutrition && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl font-bold">
              Nutrition Facts
            </h2>
            <div className="mt-6 max-w-md border border-surface-overlay bg-surface-elevated p-6">
              {product.servingSize && (
                <p className="text-sm text-text-secondary">
                  Serving Size: {product.servingSize}
                </p>
              )}
              <div className="mt-4 space-y-3 border-t border-surface-overlay pt-4">
                <NutritionRow label="Calories" value={product.calories?.toString()} />
                <NutritionRow label="Total Fat" value={product.totalFat} />
                <NutritionRow label="Sodium" value={product.sodium} />
                <NutritionRow label="Total Carbohydrates" value={product.totalCarbs} />
                <NutritionRow label="Sugars" value={product.sugars} />
                <NutritionRow label="Protein" value={product.protein} />
              </div>
            </div>
          </div>
        )}

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="font-heading text-2xl font-bold">
              You May Also Like
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((related: Product & { images: ProductImage[] }, idx: number) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Private helper components                                         */
/* ------------------------------------------------------------------ */

function ChevronIcon() {
  return (
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
  );
}

function NutritionRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span>{value}</span>
    </div>
  );
}
