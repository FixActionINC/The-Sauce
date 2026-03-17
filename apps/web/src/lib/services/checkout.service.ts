import { z } from "zod";
import { randomUUID } from "crypto";
import { Currency } from "square";
import { getSquareClient, getLocationId } from "@/lib/square";
import { verifyCheckoutProducts } from "./product.service";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  squareVariationId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutItemsSchema = z.array(lineItemSchema).min(1).max(50);

export type CheckoutItem = z.infer<typeof lineItemSchema>;

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; code: CheckoutErrorCode; message: string; details?: Record<string, unknown> };

export type CheckoutErrorCode =
  | "VALIDATION_ERROR"
  | "PRODUCT_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "SQUARE_ERROR";

// ---------------------------------------------------------------------------
// Core checkout logic
// ---------------------------------------------------------------------------

/**
 * Validate cart items, verify products against the database, and create a
 * Square payment link. This is the shared business logic used by both the
 * server action and the API route.
 */
export async function createPaymentLink(
  items: CheckoutItem[],
): Promise<CheckoutResult> {
  // -- Deduplicate by squareVariationId ---------------------------------------

  const deduped = new Map<string, number>();
  for (const item of items) {
    const current = deduped.get(item.squareVariationId) ?? 0;
    deduped.set(item.squareVariationId, current + item.quantity);
  }

  // -- Verify against database ------------------------------------------------

  const verification = await verifyCheckoutProducts(deduped);

  if (!verification.ok) {
    if (verification.unavailable.length > 0) {
      return {
        ok: false,
        code: "PRODUCT_UNAVAILABLE",
        message:
          "Some items in your cart are no longer available. Please remove them and try again.",
        details: { unavailableItems: verification.unavailable },
      };
    }

    const first = verification.insufficientStock[0];
    return {
      ok: false,
      code: "INSUFFICIENT_STOCK",
      message: `"${first.name}" only has ${first.available} left in stock. Please adjust your quantity.`,
      details: { outOfStockItems: verification.insufficientStock },
    };
  }

  const productByVariationId = new Map(
    verification.products.map((p) => [p.squareVariationId, p]),
  );

  // -- Create Square Payment Link ---------------------------------------------

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const client = getSquareClient();
    const locationId = getLocationId();

    const lineItems = Array.from(deduped).map(([variationId, quantity]) => {
      const product = productByVariationId.get(variationId)!;
      const amountInCents = Math.round(Number(product.price) * 100);

      return {
        name: product.name,
        quantity: String(quantity),
        note: `productId:${product.id}`,
        basePriceMoney: {
          amount: BigInt(amountInCents),
          currency: Currency.Usd,
        },
      };
    });

    const response = await client.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId,
        lineItems,
      },
      checkoutOptions: {
        redirectUrl: `${siteUrl}/checkout/success?orderId={order_id}`,
        askForShippingAddress: true,
      },
    });

    const checkoutUrl = response.paymentLink?.url;

    if (!checkoutUrl) {
      return {
        ok: false,
        code: "SQUARE_ERROR",
        message: "Failed to create checkout session. Please try again.",
      };
    }

    return { ok: true, url: checkoutUrl };
  } catch (err) {
    console.error("[checkout] Square payment link creation failed:", err);

    return {
      ok: false,
      code: "SQUARE_ERROR",
      message: "Payment service temporarily unavailable. Please try again.",
    };
  }
}
