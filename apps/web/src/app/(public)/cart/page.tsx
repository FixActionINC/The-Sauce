"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import CartItemRow from "@/components/cart/CartItemRow";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { brand } from "@/lib/brand";

export default function CartPage() {
  /* Hydration-safe: wait for client mount before reading persisted state. */
  const [mounted, setMounted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);

  const isEmpty = !mounted || items.length === 0;

  return (
    <main className="section-padding min-h-screen">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/products"
          className="text-sm text-text-secondary transition-colors hover:text-brand-orange"
        >
          &larr; Continue Shopping
        </Link>

        <h1 className="font-heading mt-4 text-4xl font-bold">
          Your Cart
          {mounted && totalItems > 0 && (
            <span className="ml-3 text-lg font-normal text-text-secondary">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          )}
        </h1>

        {isEmpty ? (
          /* ---------- Empty state ---------- */
          <div className="mt-12 flex flex-col items-center justify-center border border-surface-overlay bg-surface-elevated py-20 text-center">
            <Image src={brand.logo} alt="The Sauce" width={80} height={32} className="h-8 w-auto" />
            <h2 className="mt-4 font-heading text-2xl font-semibold">
              Your cart is empty
            </h2>
            <p className="mt-2 text-text-secondary">
              Looks like you have not added any sauces yet.
            </p>
            <Link href="/products" className="btn-primary mt-8">
              Browse Products
            </Link>
          </div>
        ) : (
          /* ---------- Cart contents ---------- */
          <div className="mt-8">
            {/* Item list */}
            <div className="divide-y divide-surface-overlay border border-surface-overlay bg-surface-elevated px-6">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 border border-surface-overlay bg-surface-elevated p-6">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-2xl font-bold text-text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Shipping and taxes calculated at checkout.
              </p>

              {checkoutError && (
                <div className="mt-4 border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                className="btn-primary mt-6 w-full text-base disabled:cursor-not-allowed disabled:opacity-50"
                disabled={checkoutLoading}
                onClick={async () => {
                  setCheckoutLoading(true);
                  setCheckoutError(null);

                  try {
                    const lineItems = items.map((i) => ({
                      squareVariationId: i.squareVariationId,
                      quantity: i.quantity,
                    }));

                    const result = await createCheckoutSession(lineItems);

                    if (result.url) {
                      window.location.href = result.url;
                      return;
                    }

                    setCheckoutError(
                      result.error ?? "Something went wrong. Please try again.",
                    );
                  } catch {
                    setCheckoutError("Something went wrong. Please try again.");
                  }
                  setCheckoutLoading(false);
                }}
              >
                {checkoutLoading ? "Redirecting to checkout\u2026" : "Proceed to Checkout"}
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="mt-4 w-full text-center text-sm text-text-secondary transition-colors hover:text-brand-red"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
