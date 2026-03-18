/**
 * Server component that renders a star rating display.
 *
 * Supports fractional ratings (e.g., 3.7) by rendering full, partial, and
 * empty stars using HTML star entities.
 */

interface StarRatingProps {
  rating: number; // 0-5, can be fractional
  size?: "sm" | "md";
}

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-sm" : "text-lg";
  const fullStars = Math.floor(rating);
  const hasPartial = rating - fullStars >= 0.25;
  const emptyStars = 5 - fullStars - (hasPartial ? 1 : 0);

  return (
    <span className={`inline-flex items-center ${sizeClass}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }, (_, i) => (
        <span key={`full-${i}`} className="text-brand-gold">
          &#9733;
        </span>
      ))}
      {/* Partial star -- rendered as full since HTML entities don't support partial fills */}
      {hasPartial && (
        <span key="partial" className="text-brand-gold/60">
          &#9733;
        </span>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <span key={`empty-${i}`} className="text-text-secondary/30">
          &#9733;
        </span>
      ))}
    </span>
  );
}
