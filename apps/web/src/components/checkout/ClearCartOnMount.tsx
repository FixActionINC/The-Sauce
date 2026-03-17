"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart";

/**
 * Invisible client component that clears the cart on mount.
 *
 * Used on the checkout success page to ensure the cart is emptied after
 * a successful payment. Uses the Zustand store's clearCart action as the
 * primary mechanism, with a direct localStorage removal as a fallback.
 */
export function ClearCartOnMount() {
  useEffect(() => {
    try {
      useCartStore.getState().clearCart();
    } catch {
      // Fallback: clear the persisted cart directly from localStorage
      // in case the store is not yet initialized.
      if (typeof window !== "undefined") {
        localStorage.removeItem("the-sauce-cart");
      }
    }
  }, []);

  return null;
}
