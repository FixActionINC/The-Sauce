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
  readonly totalItems: number;
  /** Sum of (price * quantity) for every item. */
  readonly totalPrice: number;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      /* ---------- state ---------- */
      items: [],
      isDrawerOpen: false,

      /* ---------- computed (getter-based) ---------- */
      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      get totalPrice() {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
      },

      /* ---------- actions ---------- */
      addItem(incoming, quantity = 1) {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === incoming.productId,
          );

          if (existing) {
            const newQty = Math.min(
              existing.quantity + quantity,
              incoming.maxStock,
            );
            return {
              items: state.items.map((i) =>
                i.productId === incoming.productId
                  ? { ...i, quantity: newQty, maxStock: incoming.maxStock }
                  : i,
              ),
            };
          }

          const clampedQty = Math.min(
            Math.max(quantity, 1),
            incoming.maxStock,
          );
          return {
            items: [...state.items, { ...incoming, quantity: clampedQty }],
          };
        });
      },

      removeItem(productId) {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId !== productId) return i;
            return { ...i, quantity: Math.min(quantity, i.maxStock) };
          }),
        }));
      },

      clearCart() {
        set({ items: [] });
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
      /** Only persist the items array -- not transient UI state. */
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
