"use client";

interface TestimonialData {
  id: number;
  name: string;
  title: string | null;
  quote: string;
  imageUrl: string | null;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-brand-gold" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialData }) {
  return (
    <div className="mx-3 w-80 flex-shrink-0 rounded-lg border border-surface-overlay bg-surface-elevated p-6">
      <StarRating rating={testimonial.rating} />
      <p className="mt-3 text-sm leading-relaxed text-text-primary">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        {testimonial.imageUrl ? (
          <img
            src={testimonial.imageUrl}
            alt={testimonial.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-orange text-sm font-bold text-white">
            {testimonial.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-text-primary">{testimonial.name}</p>
          {testimonial.title && (
            <p className="text-xs text-text-secondary">{testimonial.title}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TestimonialCarousel({
  testimonials,
}: {
  testimonials: TestimonialData[];
}) {
  if (testimonials.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const items = [...testimonials, ...testimonials];

  // Adjust speed based on number of testimonials
  const duration = Math.max(20, testimonials.length * 6);

  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 glow-orange" aria-hidden="true" />

      <h2 className="mb-12 text-center font-heading text-3xl font-bold uppercase tracking-wider md:text-4xl">
        What People Are Saying
      </h2>

      <div
        className="flex animate-scroll-left"
        style={{ "--scroll-duration": `${duration}s` } as React.CSSProperties}
      >
        {items.map((testimonial, i) => (
          <TestimonialCard key={`${testimonial.id}-${i}`} testimonial={testimonial} />
        ))}
      </div>
    </section>
  );
}
