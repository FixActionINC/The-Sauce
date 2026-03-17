import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about The Sauce -- our story, our process, and our passion for bold, authentic flavor.",
};

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="relative section-padding flex min-h-[50vh] flex-col items-center justify-center text-center"
        style={{
          backgroundImage: `url(${brand.bannerPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-surface/85" />
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-orange">
            Our Story
          </p>
          <h1 className="font-heading mt-4 text-5xl font-bold uppercase tracking-wider md:text-6xl">
            About The Sauce
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
            Born at the grill and perfected over years. A craft -- a
            balance of sweet, tangy, and savory that elevates every dish it
            touches.
          </p>
        </div>
      </section>

      {/* Tyrone + Origin Story */}
      <section className="section-padding bg-surface-elevated">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
            <div className="flex-shrink-0">
              <Image
                src={brand.tyrone}
                alt="Tyrone Jones"
                width={300}
                height={400}
                className="h-auto w-64 md:w-72"
              />
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold md:text-4xl">
                Meet Tyrone Jones
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-text-secondary">
                The Sauce started as a family BBQ recipe -- the one everyone asked
                about, the one people drove across town for. Tyrone spent years
                perfecting the balance of sweet, tangy, and savory until every drop
                was just right. Now that recipe is in every bottle we make.
              </p>
              <Image
                src={brand.poweredBy}
                alt="Powered by Tyrone Jones"
                width={180}
                height={28}
                className="mt-6 h-5 w-auto opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading mb-12 text-center text-3xl font-bold uppercase tracking-wider md:text-4xl">
            What We Stand For
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <h3 className="font-heading text-xl font-semibold text-brand-gold">
                Small Batch
              </h3>
              <p className="mt-3 text-text-secondary">
                Every bottle is crafted in small batches to ensure consistency
                and quality you can taste.
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-heading text-xl font-semibold text-brand-gold">
                Premium Ingredients
              </h3>
              <p className="mt-3 text-text-secondary">
                We source the finest ingredients -- no fillers, no shortcuts.
                Gluten-free and made with care.
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-heading text-xl font-semibold text-brand-gold">
                Family Recipe
              </h3>
              <p className="mt-3 text-text-secondary">
                From Tyrone Jones&apos; backyard grill to your table. The recipe
                everyone asked about, now in every bottle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="section-padding bg-surface-elevated">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wider md:text-4xl">
            Our Promise
          </h2>
          <div className="mt-12 space-y-12">
            <div>
              <h3 className="font-heading text-xl font-semibold text-brand-cream">
                Sourced with Intention
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-text-secondary">
                Every ingredient is chosen for a reason. Real tomatoes, pure
                spices, natural sweeteners. Nothing artificial ever makes it
                into the bottle.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold text-brand-cream">
                Cooked Low and Slow
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-text-secondary">
                Great sauce cannot be rushed. Each batch is slow-cooked to
                develop deep, layered flavor -- the kind that makes people stop
                mid-bite and ask what you put on it.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold text-brand-cream">
                Tested at the Table
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-text-secondary">
                Before a batch ships, it gets the ultimate test: the family
                table. If it does not earn a nod from the people who inspired
                the recipe, it does not leave the kitchen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-red py-16 text-center">
        <h2 className="font-heading text-3xl font-bold uppercase tracking-wider text-white">
          Ready to Taste?
        </h2>
        <p className="mt-4 text-white/80">
          Explore our collection and find your new favorite.
        </p>
        <div className="mt-8">
          <Link
            href="/products"
            className="inline-flex items-center justify-center border-2 border-white px-8 py-3 font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-brand-red"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </main>
  );
}
