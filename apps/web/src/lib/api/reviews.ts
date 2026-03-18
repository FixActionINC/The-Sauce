/**
 * Review data-access layer -- re-exports from the centralized service.
 *
 * Public-facing consumers can import from `@/lib/api/reviews`
 * without coupling to the service layer directly.
 */
export {
  getApprovedReviewsForProduct,
  getProductRatingStats,
} from "@/lib/services/review.service";
