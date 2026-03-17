"use client";

import Image from "next/image";
import type { CartItem } from "@the-sauce/shared-types";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import QuantitySelector from "@/components/product/QuantitySelector";

interface CartItemRowProps {
  item: CartItem;
  /** Render a more compact version for the drawer vs the full cart page. */
  compact?: boolean;
}

export default function CartItemRow({ item, compact = false }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-start gap-3 py-4">
      {/* Thumbnail */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden border border-surface-overlay bg-surface-elevated">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg">
            &#127798;
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              {item.name}
            </p>
            {item.variantName && (
              <p className="text-xs text-text-secondary">{item.variantName}</p>
            )}
            <p className="mt-0.5 text-xs text-text-secondary">
              {formatPrice(item.price)} each
            </p>
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="flex-shrink-0 rounded p-1 text-text-secondary transition-colors hover:text-brand-red"
            aria-label={`Remove ${item.name} from cart`}
          >
            <TrashIcon />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => updateQuantity(item.productId, qty)}
            min={1}
            max={item.maxStock}
          />
          {!compact && (
            <span className="text-sm font-semibold text-text-primary">
              {formatPrice(lineTotal)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline trash icon                                                  */
/* ------------------------------------------------------------------ */

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
