import Image from "next/image";
import Link from "next/link";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import type { ProductImage } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface ProductCardProduct {
  id: number;
  name: string;
  slug: string;
  price: number | Decimal;
  shortDescription: string | null;
  tagline: string | null;
  stock: number;
  lowStockThreshold: number;
  images: Pick<ProductImage, "url" | "alt" | "isPrimary">[];
}

interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getProductImageUrl(product.images);
  const imageAlt =
    product.images.find((img) => img.isPrimary)?.alt ??
    product.images[0]?.alt ??
    product.name;

  return (
    <div>
      <Link
        href={`/products/${product.slug}`}
        className="group block border border-surface-overlay bg-surface-elevated p-5 transition-colors duration-200 hover:border-brand-orange/50"
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-surface-overlay">
          {product.stock <= 0 && (
            <span className="absolute left-2 top-2 z-10 rounded bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">
              Sold Out
            </span>
          )}
          {product.stock > 0 && product.stock <= product.lowStockThreshold && (
            <span className="absolute left-2 top-2 z-10 rounded bg-brand-orange px-2 py-0.5 text-xs font-semibold text-white">
              Low Stock
            </span>
          )}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-overlay">
              <span className="text-xs text-text-secondary">No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-4">
          <h3 className="font-heading text-lg font-semibold leading-tight text-text-primary">
            {product.name}
          </h3>
          {(product.shortDescription ?? product.tagline) && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
              {product.shortDescription ?? product.tagline}
            </p>
          )}
          <p className="mt-3 text-lg font-bold text-brand-gold">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </div>
  );
}
