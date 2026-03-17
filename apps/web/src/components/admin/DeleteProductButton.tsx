"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/lib/actions/products";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-brand-red transition-colors hover:border-brand-red/40 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
