"use client";

const WORDS = [
  "SWEET & TANGY",
  "BOLD",
  "AUTHENTIC",
  "VERSATILE",
  "GLUTEN-FREE",
  "NO FILLERS",
  "GOURMET",
  "FAMILY RECIPE",
];

function MarqueeContent() {
  return (
    <>
      {WORDS.map((word, i) => (
        <span key={i} className="flex items-center gap-8">
          <span className="whitespace-nowrap font-heading text-2xl font-black uppercase tracking-widest md:text-3xl lg:text-4xl">
            {word}
          </span>
          <span className="text-2xl opacity-60 md:text-3xl" aria-hidden="true">
            ★
          </span>
        </span>
      ))}
    </>
  );
}

export function BrandMarquee() {
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-brand-red via-brand-orange to-brand-red py-5 md:py-6">
      <div
        className="flex items-center gap-8 animate-scroll-left"
        style={{ "--scroll-duration": "25s", width: "max-content" } as React.CSSProperties}
      >
        <MarqueeContent />
        <MarqueeContent />
      </div>
    </div>
  );
}
