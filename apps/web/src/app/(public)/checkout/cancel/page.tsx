import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Your checkout session was cancelled.",
};

export default function CheckoutCancelPage() {
  return (
    <main className="section-padding flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-overlay">
          <span className="text-4xl text-text-secondary">&#10005;</span>
        </div>
        <h1 className="font-heading mt-6 text-3xl font-bold md:text-4xl">
          Checkout Cancelled
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Your checkout session was cancelled. No charges were made. Your cart
          items are still saved.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/cart" className="btn-primary">
            Return to Cart
          </Link>
          <Link href="/products" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
