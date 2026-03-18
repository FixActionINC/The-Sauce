import type { Review } from "@prisma/client";
import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b border-surface-overlay py-6 last:border-b-0">
      <div className="flex items-center gap-3">
        <StarRating rating={review.rating} size="sm" />
        {review.isVerified && (
          <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Verified Purchase
          </span>
        )}
      </div>

      <h4 className="mt-2 text-base font-semibold text-text-primary">
        {review.title}
      </h4>

      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {review.content}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
        <span className="font-medium text-text-primary">
          {review.authorName}
        </span>
        <span aria-hidden="true">&middot;</span>
        <time dateTime={review.createdAt.toISOString()}>
          {review.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      </div>
    </div>
  );
}
