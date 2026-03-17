"use server";

import {
  checkoutItemsSchema,
  createPaymentLink,
} from "@/lib/services/checkout.service";
import type { CheckoutLineItem } from "@the-sauce/shared-types";

// ---------------------------------------------------------------------------
// Response type (kept for backward compat with cart page)
// ---------------------------------------------------------------------------

export interface CheckoutResult {
  url?: string;
  error?: string;
  code?: string;
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  items: CheckoutLineItem[],
): Promise<CheckoutResult> {
  const parsed = checkoutItemsSchema.safeParse(items);

  if (!parsed.success) {
    return {
      error: "Invalid cart items. Please refresh the page and try again.",
      code: "VALIDATION_ERROR",
    };
  }

  const result = await createPaymentLink(parsed.data);

  if (!result.ok) {
    return { error: result.message, code: result.code };
  }

  return { url: result.url };
}
