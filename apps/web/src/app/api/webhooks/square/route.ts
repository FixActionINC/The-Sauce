import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { getSquareClient } from "@/lib/square";
import { getOrderBySquareOrderId } from "@/lib/services/order.service";
import { autoDisableIfOutOfStock } from "@/lib/services/product.service";
import { db } from "@/lib/db";

/**
 * Ensure the Node.js runtime is used (required for crypto-based signature
 * verification). The Edge runtime does not support the Node.js crypto module.
 */
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Verify the Square webhook signature using HMAC-SHA256.
 *
 * Square signs each webhook with: HMAC-SHA256(signatureKey, webhookUrl + body).
 * The signature is sent in the `x-square-hmacsha256-signature` header as a
 * base64-encoded string.
 *
 * Uses `crypto.timingSafeEqual` to prevent timing-analysis attacks.
 */
function verifySquareSignature(
  rawBody: string,
  signature: string,
  signatureKey: string,
  webhookUrl: string,
): boolean {
  const payload = webhookUrl + rawBody;
  const expectedSignature = createHmac("sha256", signatureKey)
    .update(payload)
    .digest("base64");

  try {
    const sigBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Webhook event types
// ---------------------------------------------------------------------------

interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/square
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-square-hmacsha256-signature header." },
      { status: 400 },
    );
  }

  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey) {
    console.error("[webhook] SQUARE_WEBHOOK_SIGNATURE_KEY is not configured.");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 },
    );
  }

  const webhookUrl = process.env.SQUARE_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("[webhook] SQUARE_WEBHOOK_URL is not configured.");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 },
    );
  }

  // Read raw body text -- required for signature verification.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("[webhook] Failed to read request body:", err);
    return NextResponse.json(
      { error: "Failed to read request body." },
      { status: 400 },
    );
  }

  // -- Verify signature ------------------------------------------------------

  if (!verifySquareSignature(rawBody, signature, signatureKey, webhookUrl)) {
    console.error("[webhook] Signature verification failed.");
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }

  // -- Parse event -----------------------------------------------------------

  let event: SquareWebhookEvent;
  try {
    event = JSON.parse(rawBody) as SquareWebhookEvent;
  } catch {
    console.error("[webhook] Failed to parse webhook body as JSON.");
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // -- Handle events ---------------------------------------------------------

  try {
    switch (event.type) {
      case "payment.updated": {
        await handlePaymentUpdated(event);
        break;
      }
      default: {
        // Acknowledge but do not process other event types.
        console.log(`[webhook] Unhandled event type: ${event.type}`);
      }
    }
  } catch (err) {
    // Log the error but still return 200 to prevent Square from retrying
    // for non-transient failures. If the error is transient, manual replay
    // via the Square Dashboard can be used.
    console.error(
      `[webhook] Error handling event ${event.type} (${event.event_id}):`,
      err,
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

/**
 * Handle payment.updated events.
 *
 * Square fires payment.updated when a payment's status changes. We only
 * process payments that have reached "COMPLETED" status, which indicates
 * the payment was successfully captured.
 *
 * This handler is idempotent: it checks if an order with the given
 * squareOrderId already exists before creating a new one.
 */
async function handlePaymentUpdated(event: SquareWebhookEvent) {
  const paymentData = event.data.object?.payment as
    | Record<string, unknown>
    | undefined;

  if (!paymentData) {
    console.log("[webhook] payment.updated event has no payment data, skipping.");
    return;
  }

  const status = paymentData.status as string | undefined;

  // Only process completed payments.
  if (status !== "COMPLETED") {
    console.log(
      `[webhook] payment.updated with status "${status}", skipping.`,
    );
    return;
  }

  const squarePaymentId = paymentData.id as string;
  const squareOrderId = paymentData.order_id as string | undefined;

  console.log(
    `[webhook] Payment completed: ${squarePaymentId}`,
    `| order: ${squareOrderId ?? "none"}`,
  );

  if (!squareOrderId) {
    console.log("[webhook] No order_id on payment, skipping order persistence.");
    return;
  }

  // -- Idempotency check: skip if order already exists ------------------------

  const existingOrder = await getOrderBySquareOrderId(squareOrderId);

  if (existingOrder) {
    console.log(
      `[webhook] Order for squareOrderId ${squareOrderId} already exists (id=${existingOrder.id}), skipping.`,
    );
    return;
  }

  // -- Retrieve the full order from Square to get line items ------------------

  let squareOrder: Record<string, unknown> | null = null;

  try {
    const client = getSquareClient();
    const orderResponse = await client.orders.get({
      orderId: squareOrderId,
    });
    squareOrder = orderResponse.order as unknown as Record<string, unknown> | null;
  } catch (err) {
    console.error(
      "[webhook] Failed to retrieve order from Square:",
      squareOrderId,
      err,
    );
    return;
  }

  if (!squareOrder) {
    console.error("[webhook] Square returned no order for:", squareOrderId);
    return;
  }

  // -- Parse line items and extract product IDs from note field --------------

  const lineItems = (squareOrder.lineItems as Array<Record<string, unknown>>) ?? [];

  /** Parse "productId:123" from line item note field. Returns null if not found. */
  function parseProductId(note: unknown): number | null {
    if (typeof note !== "string") return null;
    const match = note.match(/^productId:(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  // -- Extract order data before the transaction ------------------------------

  // Extract customer and shipping info from the Square order.
  const fulfillments = (squareOrder.fulfillments as Array<Record<string, unknown>>) ?? [];
  const shipmentDetails = fulfillments.find(
    (f) => f.type === "SHIPMENT",
  );
  const shippingDetails = (shipmentDetails?.shipmentDetails as Record<string, unknown>) ?? {};
  const recipient = (shippingDetails.recipient as Record<string, unknown>) ?? {};
  const shippingAddress = recipient.address as Record<string, unknown> | undefined;

  // Extract amounts. Square uses BigInt but JSON serializes them as numbers.
  const totalMoney = squareOrder.totalMoney as Record<string, unknown> | undefined;
  const amountTotal = totalMoney?.amount != null
    ? Number(totalMoney.amount)
    : 0;

  // Extract buyer email from the tenders or payment data.
  const buyerEmail = (paymentData.buyer_email_address as string) ??
    (recipient.emailAddress as string) ??
    null;

  const customerName = recipient.displayName as string | undefined ?? null;
  const shippingName = customerName;

  const orderItemsData = lineItems.map((item) => {
    const basePriceMoney = item.basePriceMoney as Record<string, unknown> | undefined;
    const totalItemMoney = item.totalMoney as Record<string, unknown> | undefined;
    const unitAmount = basePriceMoney?.amount != null
      ? Number(basePriceMoney.amount)
      : 0;
    const totalAmount = totalItemMoney?.amount != null
      ? Number(totalItemMoney.amount)
      : 0;
    const quantityStr = item.quantity as string | undefined;

    return {
      productName: (item.name as string) ?? "Unknown product",
      squareVariationId: (item.catalogObjectId as string) ?? null,
      quantity: quantityStr ? parseInt(quantityStr, 10) : 0,
      unitAmount,
      totalAmount,
    };
  });

  // -- Create order + decrement stock in a single transaction -----------------
  // Order is created first so we always have a paper trail. Stock decrement
  // follows inside the same transaction so both succeed or both roll back.

  try {
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the order record (paper trail first)
      await tx.order.create({
        data: {
          squareOrderId,
          squarePaymentId: squarePaymentId ?? null,
          customerEmail: buyerEmail,
          customerName,
          shippingName,
          shippingAddress: shippingAddress
            ? JSON.stringify({
                line1: shippingAddress.addressLine1 ?? null,
                line2: shippingAddress.addressLine2 ?? null,
                city: shippingAddress.locality ?? null,
                state: shippingAddress.administrativeDistrictLevel1 ?? null,
                postal_code: shippingAddress.postalCode ?? null,
                country: shippingAddress.country ?? null,
              })
            : null,
          amountTotal,
          currency: ((totalMoney?.currency as string) ?? "USD").toLowerCase(),
          items: {
            create: orderItemsData,
          },
        },
      });

      // 2. Decrement stock for each line item using product ID from note field
      for (const item of lineItems) {
        const quantityStr = item.quantity as string | undefined;
        const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;
        if (quantity <= 0) continue;

        const productId = parseProductId(item.note);

        if (productId) {
          // Use the reliable product ID stored in the note field
          await tx.product.updateMany({
            where: {
              id: productId,
              stock: { gte: quantity },
            },
            data: {
              stock: { decrement: quantity },
            },
          });
        } else {
          // Fallback for orders created before productId was stored in note.
          // Match by name as a best-effort approach.
          const itemName = item.name as string | undefined;
          if (itemName) {
            console.warn(
              `[webhook] No productId in note for "${itemName}", falling back to name match.`,
            );
            await tx.product.updateMany({
              where: {
                name: itemName,
                stock: { gte: quantity },
              },
              data: {
                stock: { decrement: quantity },
              },
            });
          }
        }
      }
    });

    console.log(
      `[webhook] Order + stock update persisted for squareOrderId ${squareOrderId}.`,
    );

    // Best-effort: auto-disable products that have reached zero stock
    // and have the autoDisableWhenOutOfStock flag enabled.
    for (const item of lineItems) {
      const productId = parseProductId(item.note);
      if (productId) {
        try {
          await autoDisableIfOutOfStock(productId);
        } catch (err) {
          console.error(
            `[webhook] Failed to auto-disable product ${productId}:`,
            err,
          );
        }
      }
    }
  } catch (err) {
    // Transaction failed -- both order and stock changes are rolled back.
    // The payment was already captured by Square. The order can be reconciled
    // from the Square Dashboard later.
    console.error(
      `[webhook] Failed to persist order + stock for squareOrderId ${squareOrderId}:`,
      err,
    );
  }
}
