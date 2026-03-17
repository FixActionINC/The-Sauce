import type { Product, ProductImage } from "@prisma/client";
import { getProductImageUrl } from "./utils";

/**
 * Resolve the canonical site URL from the NEXT_PUBLIC_SITE_URL env var.
 * Falls back to localhost for development.
 */
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Resolve the CDN-backed logo URL.
 */
function getLogoUrl(): string {
  const cdn = process.env.NEXT_PUBLIC_CDN_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}`
    : "";
  return `${cdn}/brand/logo.png`;
}

/**
 * Organization JSON-LD (schema.org/Organization).
 *
 * Placed on the homepage to identify the business entity to search engines.
 */
export function organizationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Sauce by Tyrone Jones",
    url: siteUrl,
    logo: getLogoUrl(),
    description:
      "Bold, authentic, versatile. The sweet and tangy gourmet everything sauce crafted from a family BBQ recipe.",
    founder: {
      "@type": "Person",
      name: "Tyrone Jones",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${siteUrl}/contact`,
    },
  };
}

/**
 * WebSite JSON-LD with SearchAction (schema.org/WebSite).
 *
 * Enables the site search box in Google results. The target URL pattern
 * uses the /products page with a query parameter.
 */
export function webSiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Sauce by Tyrone Jones",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Product JSON-LD (schema.org/Product).
 *
 * Generates rich product snippets with offers, brand, and images.
 * Price is converted from Prisma Decimal to a plain number string.
 */
export function productJsonLd(
  product: Product & { images: ProductImage[] },
) {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const primaryImage = getProductImageUrl(product.images);

  // Collect all image URLs for the images array
  const imageUrls = product.images
    .map((img) => img.url)
    .filter(Boolean);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: "The Sauce",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: Number(product.price).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "The Sauce by Tyrone Jones",
      },
    },
  };

  if (product.shortDescription) {
    jsonLd.description = product.shortDescription;
  } else if (product.description) {
    // Strip HTML tags for the plain-text description
    jsonLd.description = product.description.replace(/<[^>]*>/g, "");
  }

  if (primaryImage) {
    jsonLd.image = imageUrls.length > 1 ? imageUrls : primaryImage;
  }

  if (product.squareCatalogId) {
    jsonLd.sku = product.squareCatalogId;
  }

  if (product.category) {
    jsonLd.category = product.category;
  }

  return jsonLd;
}

/**
 * BreadcrumbList JSON-LD (schema.org/BreadcrumbList).
 *
 * Generates a three-level breadcrumb: Home > Products > Product Name.
 */
export function breadcrumbJsonLd(productName: string, productSlug: string) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${siteUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: `${siteUrl}/products/${productSlug}`,
      },
    ],
  };
}
