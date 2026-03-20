import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@the-sauce/shared-types";

/* ------------------------------------------------------------------ */
/*  State & Actions                                                    */
/* ------------------------------------------------------------------ */

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
}

interface CartActions {
  /**
   * Add an item to the cart, or increment its quantity if it already exists.
   * Respects the `maxStock` ceiling.
   */
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;

  /** Remove an item from the cart entirely. */
  removeItem: (productId: number) => void;

  /**
   * Set the quantity for a given item (clamped to 1..maxStock).
   * If `quantity` is 0 or below the item is removed.
   */
  updateQuantity: (productId: number, quantity: number) => void;

  /** Empty the cart. */
  clearCart: () => void;

  /** Drawer visibility controls. */
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export interface CartStore extends CartState, CartActions {
  /** Sum of all item quantities. */
  totalItems: number;
  /** Sum of (price * quantity) for every item. */
  totalPrice: number;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

function computeTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      /* ---------- state ---------- */
      items: [],
      isDrawerOpen: false,
      totalItems: 0,
      totalPrice: 0,

      /* ---------- actions ---------- */
      addItem(incoming, quantity = 1) {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === incoming.productId,
          );

          let newItems: CartItem[];
          if (existing) {
            const newQty = Math.min(
              existing.quantity + quantity,
              incoming.maxStock,
            );
            newItems = state.items.map((i) =>
              i.productId === incoming.productId
                ? { ...i, quantity: newQty, maxStock: incoming.maxStock }
                : i,
            );
          } else {
            const clampedQty = Math.min(
              Math.max(quantity, 1),
              incoming.maxStock,
            );
            newItems = [...state.items, { ...incoming, quantity: clampedQty }];
          }

          return { items: newItems, ...computeTotals(newItems) };
        });
      },

      removeItem(productId) {
        set((state) => {
          const newItems = state.items.filter((i) => i.productId !== productId);
          return { items: newItems, ...computeTotals(newItems) };
        });
      },

      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((i) => {
            if (i.productId !== productId) return i;
            return { ...i, quantity: Math.min(quantity, i.maxStock) };
          });
          return { items: newItems, ...computeTotals(newItems) };
        });
      },

      clearCart() {
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },

      openDrawer() {
        set({ isDrawerOpen: true });
      },
      closeDrawer() {
        set({ isDrawerOpen: false });
      },
      toggleDrawer() {
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen }));
      },
    }),
    {
      name: "the-sauce-cart",
      /** Persist items + computed totals; exclude transient UI state. */
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
      }),
      /** Recalculate totals on rehydration in case persisted totals are stale. */
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totals = computeTotals(state.items);
          state.totalItems = totals.totalItems;
          state.totalPrice = totals.totalPrice;
        }
      },
    },
  ),
);
