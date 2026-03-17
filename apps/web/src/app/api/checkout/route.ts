import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkoutItemsSchema,
  createPaymentLink,
} from "@/lib/services/checkout.service";

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  items: checkoutItemsSchema,
});

// ---------------------------------------------------------------------------
// POST /api/checkout
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body.", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid checkout request. Please check your cart and try again.",
        code: "VALIDATION_ERROR",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createPaymentLink(parsed.data.items);

  if (!result.ok) {
    const status = result.code === "SQUARE_ERROR" ? 500 : 422;
    return NextResponse.json(
      { error: result.message, code: result.code, ...result.details },
      { status },
    );
  }

  return NextResponse.json({ url: result.url }, { status: 200 });
}
