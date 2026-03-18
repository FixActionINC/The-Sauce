"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Review, ReviewStatus } from "@prisma/client";
import { moderateReview, removeReview } from "@/lib/actions/reviews";

type ReviewWithProduct = Review & {
  product: { name: string; slug: string };
};

type FilterTab = "all" | ReviewStatus;

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    pending: "bg-brand-gold/20 text-brand-gold",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-brand-red/20 text-brand-red",
  };

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-brand-gold text-sm">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function ReviewRow({ review }: { review: ReviewWithProduct }) {
  const [isApproving, startApproveTransition] = useTransition();
  const [isRejecting, startRejectTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleApprove() {
    startApproveTransition(async () => {
      const result = await moderateReview(review.id, "approved");
      if (result.error) alert(result.error);
    });
  }

  function handleReject() {
    startRejectTransition(async () => {
      const result = await moderateReview(review.id, "rejected");
      if (result.error) alert(result.error);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete review "${review.title}" by ${review.authorName}?`))
      return;
    startDeleteTransition(async () => {
      const result = await removeReview(review.id);
      if (result.error) alert(result.error);
    });
  }

  const busy = isApproving || isRejecting || isDeleting;

  return (
    <tr className="bg-surface transition-colors hover:bg-surface-elevated/50">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
        {review.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/products/${review.product.slug}`}
          className="text-brand-orange transition-colors hover:text-brand-gold"
        >
          {review.product.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-text-primary">
        <div>{review.authorName}</div>
        <div className="text-xs text-text-secondary">{review.authorEmail}</div>
      </td>
      <td className="px-4 py-3">
        <StarDisplay rating={review.rating} />
      </td>
      <td className="max-w-xs px-4 py-3 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">{review.title}</span>
        {review.content.length > 60 && (
          <span title={review.content}>
            {" "}
            &mdash; {review.content.slice(0, 60)}...
          </span>
        )}
        {review.content.length <= 60 && (
          <span> &mdash; {review.content}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={review.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {review.status !== "approved" && (
            <button
              onClick={handleApprove}
              disabled={busy}
              className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-green-400 transition-colors hover:border-green-500/40 disabled:opacity-50"
            >
              {isApproving ? "..." : "Approve"}
            </button>
          )}
          {review.status !== "rejected" && (
            <button
              onClick={handleReject}
              disabled={busy}
              className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-brand-orange transition-colors hover:border-brand-orange/40 disabled:opacity-50"
            >
              {isRejecting ? "..." : "Reject"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-brand-red transition-colors hover:border-brand-red/40 disabled:opacity-50"
          >
            {isDeleting ? "..." : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function ReviewsManager({ reviews }: { reviews: ReviewWithProduct[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all"
      ? reviews
      : reviews.filter((r) => r.status === activeTab);

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-surface-overlay bg-surface-elevated p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-text-secondary">
              ({counts[tab.value]})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Product
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Author
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Rating
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Review
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-text-secondary"
                >
                  No reviews found.
                </td>
              </tr>
            )}
            {filtered.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
