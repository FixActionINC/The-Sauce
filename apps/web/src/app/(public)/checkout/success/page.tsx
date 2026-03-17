import type { Metadata } from "next";
import Link from "next/link";
import { getSquareClient } from "@/lib/square";
import { getOrderBySquareOrderId } from "@/lib/services/order.service";
import { ClearCartOnMount } from "@/components/checkout/ClearCartOnMount";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  // If there is no orderId, show a generic thank-you page.
  if (!orderId) {
    return <GenericSuccess />;
  }

  // Verify this order exists in our local database before exposing any
  // details. This prevents enumeration of arbitrary Square order IDs.
  const localOrder = await getOrderBySquareOrderId(orderId);
  if (!localOrder) {
    return <GenericSuccess />;
  }

  // Retrieve the Square order for line-item details.
  let order: Record<string, unknown> | null = null;
  try {
    const client = getSquareClient();
    const response = await client.orders.get({ orderId });
    order = (response.order as unknown as Record<string, unknown>) ?? null;
  } catch {
    return <GenericSuccess />;
  }

  if (!order) {
    return <GenericSuccess />;
  }

  // Extract only non-PII fields (items, totals).
  const lineItems = (order.lineItems as Array<Record<string, unknown>>) ?? [];
  const totalMoney = order.totalMoney as Record<string, unknown> | undefined;
  const amountTotal = totalMoney?.amount != null ? Number(totalMoney.amount) : null;

  const serviceCharges = (order.serviceCharges as Array<Record<string, unknown>>) ?? [];
  const shippingCharge = serviceCharges.find(
    (sc) => (sc.name as string)?.toLowerCase().includes("shipping"),
  );
  const shippingMoney = shippingCharge?.amountMoney as Record<string, unknown> | undefined;
  const shippingAmount = shippingMoney?.amount != null
    ? Number(shippingMoney.amount)
    : null;

  return (
    <main className="section-padding flex min-h-screen items-center justify-center">
      <ClearCartOnMount />

      <div className="mx-auto w-full max-w-2xl">
        {/* Confirmation header */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/10">
            <span className="text-4xl text-brand-orange">&#10003;</span>
          </div>
          <h1 className="font-heading mt-6 text-3xl font-bold md:text-4xl">
            Order Confirmed!
          </h1>
          <p className="mt-4 text-lg text-text-secondary">
            Thank you for your purchase. Your sauces are on their way.
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            A confirmation email will be sent to the address you provided.
          </p>
        </div>

        {/* Order details card */}
        <div className="mt-10 rounded-xl border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Order Summary</h2>

          {/* Line items */}
          {lineItems.length > 0 && (
            <ul className="mt-4 divide-y divide-border">
              {lineItems.map((item, idx) => {
                const itemTotalMoney = item.totalMoney as
                  | Record<string, unknown>
                  | undefined;
                const itemTotal = itemTotalMoney?.amount != null
                  ? Number(itemTotalMoney.amount)
                  : 0;

                return (
                  <li
                    key={idx}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {item.name as string}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Qty: {item.quantity as string}
                      </p>
                    </div>
                    <p className="font-medium">{formatCents(itemTotal)}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Shipping */}
          {shippingAmount != null && shippingAmount > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm text-text-secondary">
              <span>Shipping</span>
              <span>{formatCents(shippingAmount)}</span>
            </div>
          )}

          {/* Total */}
          {amountTotal != null && (
            <div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-lg font-bold">
              <span>Total</span>
              <span>{formatCents(amountTotal)}</span>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Fallback when no orderId is present
// ---------------------------------------------------------------------------

function GenericSuccess() {
  return (
    <main className="section-padding flex min-h-screen items-center justify-center">
      <ClearCartOnMount />

      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/10">
          <span className="text-4xl text-brand-orange">&#10003;</span>
        </div>
        <h1 className="font-heading mt-6 text-3xl font-bold md:text-4xl">
          Thank You!
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          If you completed a purchase, you will receive a confirmation email
          shortly. Your sauces are on their way!
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
