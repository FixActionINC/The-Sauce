"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createReview,
  updateReviewStatus as svcUpdateStatus,
  deleteReview as svcDelete,
} from "@/lib/services/review.service";
import type { ReviewStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Public review submission
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  productId: z.coerce.number().int().positive("Invalid product"),
  authorName: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long"),
  authorEmail: z.string().email("Please enter a valid email address"),
  rating: z.coerce.number().int().min(1, "Rating is required").max(5),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  content: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(5000, "Review is too long"),
  website: z.string().optional(), // honeypot
});

// ---------------------------------------------------------------------------
// In-memory rate limiting -- 3 reviews per hour per IP
// ---------------------------------------------------------------------------

const REVIEW_MAX_ATTEMPTS = 3;
const REVIEW_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const reviewAttempts = new Map<string, RateLimitEntry>();

function getClientIp(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

function isReviewRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = reviewAttempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    reviewAttempts.set(ip, { count: 1, resetAt: now + REVIEW_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > REVIEW_MAX_ATTEMPTS;
}

// Periodically clean up stale entries
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of reviewAttempts) {
      if (now >= entry.resetAt) reviewAttempts.delete(ip);
    }
  }, REVIEW_WINDOW_MS).unref();
}

export interface ReviewFormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function submitReview(
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const raw = {
    productId: formData.get("productId"),
    authorName: formData.get("authorName"),
    authorEmail: formData.get("authorEmail"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    content: formData.get("content"),
    website: formData.get("website"),
  };

  const parsed = reviewSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  // Honeypot: if the hidden "website" field is filled, it is a bot
  if (parsed.data.website) {
    return { success: true };
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  if (isReviewRateLimited(ip)) {
    return { error: "Too many submissions. Please try again later." };
  }

  try {
    await createReview({
      productId: parsed.data.productId,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      rating: parsed.data.rating,
      title: parsed.data.title,
      content: parsed.data.content,
    });
  } catch (err) {
    console.error("Failed to save review:", err);
    return { error: "Failed to submit review. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/admin/reviews");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin actions (auth-gated)
// ---------------------------------------------------------------------------

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

export async function moderateReview(
  reviewId: number,
  status: ReviewStatus
): Promise<ReviewActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    await svcUpdateStatus(reviewId, status);
  } catch (err) {
    console.error("Failed to moderate review:", err);
    return { error: "Failed to update review status." };
  }

  revalidatePath("/products");
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function removeReview(
  reviewId: number
): Promise<ReviewActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    await svcDelete(reviewId);
  } catch (err) {
    console.error("Failed to delete review:", err);
    return { error: "Failed to delete review." };
  }

  revalidatePath("/products");
  revalidatePath("/admin/reviews");
  return { success: true };
}
