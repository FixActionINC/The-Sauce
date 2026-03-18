"use client";

import { useActionState } from "react";
import {
  submitReview,
  type ReviewFormState,
} from "@/lib/actions/reviews";

const initialState: ReviewFormState = {};

export function ReviewForm({ productId }: { productId: number }) {
  const [state, formAction, pending] = useActionState(
    submitReview,
    initialState
  );

  if (state.success) {
    return (
      <div className="mt-8 border border-brand-gold/30 bg-brand-gold/10 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-brand-gold">
          Thank you for your review! It will appear after moderation.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error && !state.fieldErrors && (
        <div className="border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {state.error}
        </div>
      )}

      {/* Hidden product ID */}
      <input type="hidden" name="productId" value={productId} />

      {/* Honeypot field -- hidden from real users, bots will fill it in */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="review-website">Website</label>
        <input
          type="text"
          id="review-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="review-authorName"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Name
        </label>
        <input
          type="text"
          id="review-authorName"
          name="authorName"
          placeholder="Your name"
          required
          className="w-full border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        {state.fieldErrors?.authorName && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.authorName[0]}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="review-authorEmail"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Email
        </label>
        <input
          type="email"
          id="review-authorEmail"
          name="authorEmail"
          placeholder="you@example.com"
          required
          className="w-full border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Your email will not be displayed publicly.
        </p>
        {state.fieldErrors?.authorEmail && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.authorEmail[0]}
          </p>
        )}
      </div>

      {/* Rating */}
      <div>
        <label
          htmlFor="review-rating"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Rating
        </label>
        <select
          id="review-rating"
          name="rating"
          required
          defaultValue=""
          className="w-full border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        >
          <option value="" disabled>
            Select a rating
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n !== 1 ? "s" : ""}
            </option>
          ))}
        </select>
        {state.fieldErrors?.rating && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.rating[0]}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Review Title
        </label>
        <input
          type="text"
          id="review-title"
          name="title"
          placeholder="Summarize your experience"
          required
          className="w-full border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Your Review
        </label>
        <textarea
          id="review-content"
          name="content"
          rows={5}
          placeholder="Tell us what you thought..."
          required
          className="w-full resize-none border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        {state.fieldErrors?.content && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.content[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
