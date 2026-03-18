import { getReviewsForAdmin } from "@/lib/services/review.service";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export default async function AdminReviewsPage() {
  const reviews = await getReviewsForAdmin();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <div className="mt-6">
        <ReviewsManager reviews={reviews} />
      </div>
    </div>
  );
}
