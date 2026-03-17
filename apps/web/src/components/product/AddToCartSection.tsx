"use client";

import { useState, useCallback, useRef } from "react";
import { useCartStore } from "@/stores/cart";
import QuantitySelector from "./QuantitySelector";

interface AddToCartSectionProps {
  inStock: boolean;
  productId: number;
  productName: string;
  price: number;
  image: string;
  squareVariationId: string;
  stock: number;
}

/**
 * Client component that manages quantity state, integrates with the Zustand
 * cart store, and renders the Add to Cart button alongside a quantity selector.
 */
export default function AddToCartSection({
  inStock,
  productId,
  productName,
  price,
  image,
  squareVariationId,
  stock,
}: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const handleAddToCart = useCallback(() => {
    if (!inStock) return;

    addItem(
      {
        productId,
        name: productName,
        price,
        image,
        squareVariationId,
        maxStock: stock,
      },
      quantity,
    );

    // Show brief "Added!" confirmation
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1500);

    // Reset quantity and open the drawer
    setQuantity(1);
    openDrawer();
  }, [inStock, addItem, productId, productName, price, image, squareVariationId, stock, quantity, openDrawer]);

  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
      <QuantitySelector
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={stock > 0 ? stock : 1}
      />
      <button
        type="button"
        disabled={!inStock || added}
        onClick={handleAddToCart}
        className="btn-primary flex-1 text-base transition-all disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!inStock ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}
