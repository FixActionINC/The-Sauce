"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import CartItemRow from "./CartItemRow";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: {
    x: "100%",
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);

  const panelRef = useRef<HTMLDivElement>(null);

  /* ---- Escape key ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    },
    [closeDrawer],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* ---- Body scroll lock ---- */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ---- Focus trap (simple: focus panel on open) ---- */
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            className="fixed inset-0 z-50 bg-black/60"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="cart-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-surface-overlay bg-surface shadow-2xl outline-none"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-overlay px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-text-primary">
                Your Cart
                {totalItems > 0 && (
                  <span className="ml-2 text-sm font-normal text-text-secondary">
                    ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 text-text-secondary transition-colors hover:text-text-primary"
                aria-label="Close cart"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="text-4xl">&#127798;</p>
                <p className="mt-4 font-heading text-lg font-semibold text-text-primary">
                  Your cart is empty
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Looks like you have not added any sauces yet.
                </p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="btn-primary mt-6"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Scrollable items list */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="divide-y divide-surface-overlay">
                    {items.map((item) => (
                      <CartItemRow
                        key={item.productId}
                        item={item}
                        compact
                      />
                    ))}
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="border-t border-surface-overlay px-6 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      Subtotal
                    </span>
                    <span className="text-lg font-bold text-text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="btn-primary block w-full text-center"
                  >
                    View Cart &amp; Checkout
                  </Link>

                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="mt-3 block w-full text-center text-sm text-text-secondary transition-colors hover:text-brand-orange"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline close (X) icon                                              */
/* ------------------------------------------------------------------ */

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
