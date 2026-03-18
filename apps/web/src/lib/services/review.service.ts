import { cache } from "react";
import { db } from "@/lib/db";
import type { ReviewStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Public queries (cached)
// ---------------------------------------------------------------------------

export const getApprovedReviewsForProduct = cache(async (productId: number) => {
  return db.review.findMany({
    where: { productId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
});

export const getProductRatingStats = cache(async (productId: number) => {
  const result = await db.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    averageRating: result._avg.rating ?? 0,
    reviewCount: result._count.rating,
  };
});

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export const getReviewsForAdmin = cache(async (status?: ReviewStatus) => {
  return db.review.findMany({
    where: status ? { status } : undefined,
    include: {
      product: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

export const getPendingReviewCount = cache(async () => {
  return db.review.count({ where: { status: "pending" } });
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function createReview(data: {
  productId: number;
  rating: number;
  authorName: string;
  authorEmail: string;
  title: string;
  content: string;
}) {
  return db.review.create({ data });
}

export function updateReviewStatus(id: number, status: ReviewStatus) {
  return db.review.update({
    where: { id },
    data: { status },
  });
}

export function deleteReview(id: number) {
  return db.review.delete({ where: { id } });
}
