/**
 * Brand asset URLs served from S3 + CloudFront CDN.
 *
 * The CDN domain comes from NEXT_PUBLIC_CDN_DOMAIN env var.
 * All brand images live under the `brand/` prefix in the S3 images bucket.
 */

const CDN = process.env.NEXT_PUBLIC_CDN_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}`
  : "";

function brandUrl(filename: string): string {
  return `${CDN}/brand/${filename}`;
}

export const brand = {
  logo: brandUrl("logo.png"),
  heroBottle: brandUrl("hero-bottle.png"),
  bottleClean: brandUrl("bottle-clean.jpg"),
  bottleNarrow: brandUrl("bottle-narrow.png"),
  ingredients: brandUrl("ingredients.png"),
  tyrone: brandUrl("tyrone-caricature.png"),
  poweredBy: brandUrl("powered-by.png"),
  bannerPattern: brandUrl("banner-pattern.png"),
} as const;
