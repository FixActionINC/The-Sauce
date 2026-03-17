import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getFeaturedProducts } from "@/lib/api/products";
import { getFeaturedTestimonials } from "@/lib/api/testimonials";
import { getActiveGalleryImages } from "@/lib/api/gallery";
import { getSiteSettings } from "@/lib/api/site-settings";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { brand } from "@/lib/brand";
import {
  FadeIn,
  ScaleIn,
  StaggerContainer,
  AnimatedCard,
  SlideIn,
} from "@/components/motion";
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { UsageSection } from "@/components/home/UsageSection";
import { PhotoGrid } from "@/components/home/PhotoGrid";
import { VideoSection } from "@/components/home/VideoSection";

export default async function HomePage() {
  const [featuredProducts, testimonials, galleryImages, settings] = await Promise.all([
    getFeaturedProducts(),
    getFeaturedTestimonials(),
    getActiveGalleryImages(),
    getSiteSettings(),
  ]);

  return (
    <main>
      {/* ── Hero Section ── */}
      <Container>
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center gap-12 py-20 lg:flex-row lg:gap-16">
          <div className="pointer-events-none absolute inset-0 glow-red" aria-hidden="true" />

          <ScaleIn className="flex-1 flex items-center justify-center">
            <Image
              src={brand.heroBottle}
              alt="The Sauce - bottle with fresh ingredients"
              width={600}
              height={700}
              className="h-auto w-full max-w-md lg:max-w-lg"
              priority
            />
          </ScaleIn>

          <FadeIn delay={0.3} className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <Image
              src={brand.logo}
              alt="The Sauce"
              width={280}
              height={112}
              className="h-auto w-56 lg:w-72"
              priority
            />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary lg:text-xl">
              The sweet &amp; tangy gourmet everything sauce. Bold. Authentic.
              Versatile.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              From BBQ to breakfast and everything in between. Gluten-free. No
              fillers.
            </p>
            <Link href="/products" className="btn-primary mt-8 text-lg">
              Buy Now
            </Link>
          </FadeIn>
        </section>
      </Container>

      {/* ── Brand Marquee ── full-width red/orange scrolling ticker */}
      <BrandMarquee />

      {/* ── Ingredients Infographic ── */}
      <Container>
        <FadeIn className="mx-auto max-w-4xl py-16 lg:py-24">
          <Image
            src={brand.ingredients}
            alt="The Sauce ingredients - sweet with a little tang"
            width={1200}
            height={600}
            className="h-auto w-full"
          />
        </FadeIn>
      </Container>

      {/* ── Featured Products ── on warm cream background */}
      <section className="bg-surface-warm py-16 lg:py-24">
        <Container>
          <FadeIn>
            <h2 className="text-center font-heading text-3xl font-bold uppercase tracking-wider text-text-inverse md:text-4xl">
              Shop The Sauce
            </h2>
          </FadeIn>

          <StaggerContainer className="mx-auto mt-12 flex flex-wrap items-end justify-center gap-12">
            {featuredProducts.slice(0, 3).map((product) => {
              const imageUrl = getProductImageUrl(product.images);

              return (
                <AnimatedCard key={product.id} className="w-56 text-center">
                  <Link
                    href={`/products/${product.slug}`}
                    className="group block"
                  >
                    {imageUrl ? (
                      <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={product.images[0]?.alt ?? product.name}
                          fill
                          className="object-contain"
                          sizes="224px"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] w-full bg-surface-warm-elevated" />
                    )}
                    <h3 className="mt-4 font-heading text-lg font-semibold text-text-inverse">
                      {product.name}
                    </h3>
                    <p className="mt-1 font-bold text-brand-red">
                      {formatPrice(product.price)}
                    </p>
                  </Link>
                </AnimatedCard>
              );
            })}
          </StaggerContainer>

          <FadeIn className="mt-10 text-center">
            <Link href="/products" className="btn-primary">
              View All Products
            </Link>
          </FadeIn>
        </Container>
      </section>

      {/* ── Put It On Everything ── full-width orange/red gradient */}
      <UsageSection />

      {/* ── Story with Tyrone ── */}
      <Container>
        <section className="relative flex flex-col items-center gap-12 py-16 lg:flex-row lg:gap-16 lg:py-24">
          <div className="pointer-events-none absolute inset-0 glow-red" aria-hidden="true" />

          <SlideIn direction="left" className="flex-1 flex justify-center">
            <Image
              src={brand.tyrone}
              alt="Tyrone Jones caricature"
              width={400}
              height={500}
              className="h-auto w-full max-w-xs lg:max-w-sm"
            />
          </SlideIn>

          <SlideIn direction="right" delay={0.2} className="flex-1 text-center lg:text-left">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-wider md:text-4xl">
              Born at the Grill
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              The Sauce started as a family BBQ recipe -- the one everyone
              asked about, the one people drove across town for. Tyrone Jones
              spent years perfecting the balance of sweet, tangy, and savory
              until every drop was just right.
            </p>
            <Link href="/about" className="btn-secondary mt-8">
              Read Our Story
            </Link>
            <Image
              src={brand.poweredBy}
              alt="Powered by Tyrone Jones"
              width={200}
              height={30}
              className="mt-8 h-6 w-auto opacity-50 lg:mx-0 mx-auto"
            />
          </SlideIn>
        </section>
      </Container>

      {/* ── Testimonial Carousel ── */}
      <FadeIn>
        <TestimonialCarousel testimonials={testimonials} />
      </FadeIn>

      {/* ── Video Section ── */}
      <VideoSection videoUrl={settings?.heroVideoUrl ?? null} />

      {/* ── Photo Grid ── Instagram-style */}
      <PhotoGrid images={galleryImages} />

      {/* ── Final CTA ── solid red background */}
      <section className="bg-brand-red py-16 lg:py-24">
        <Container>
          <FadeIn>
            <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
              <div className="flex-1">
                <h2 className="font-heading text-4xl font-black uppercase tracking-wider text-white md:text-5xl lg:text-6xl">
                  Order Now
                </h2>
                <p className="mt-4 text-lg text-white/80">
                  Join thousands of fans who put The Sauce on everything.
                </p>
                <Link
                  href="/products"
                  className="mt-8 inline-flex items-center justify-center bg-white px-8 py-4 text-lg font-bold uppercase tracking-wider text-brand-red transition-all hover:bg-brand-cream hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                  Shop Now
                </Link>
              </div>
              <div className="flex-shrink-0">
                <Image
                  src={brand.bottleClean}
                  alt="The Sauce bottle"
                  width={200}
                  height={400}
                  className="h-64 w-auto lg:h-80"
                />
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </main>
  );
}
