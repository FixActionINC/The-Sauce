import { cache } from "react";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateOrderItemData {
  productName: string;
  squareVariationId?: string | null;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
}

export interface CreateOrderData {
  squareOrderId: string;
  squarePaymentId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  shippingName?: string | null;
  shippingAddress?: string | null;
  amountTotal: number;
  shippingAmount?: number | null;
  currency?: string;
  items: CreateOrderItemData[];
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of orders, newest first.
 * Returns items for each order.
 */
export async function getOrders(page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await db.$transaction([
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
      include: { items: true },
    }),
    db.order.count(),
  ]);

  return { items, total };
}

/**
 * Fetch a single order by its internal ID, including line items.
 */
export async function getOrderById(id: number) {
  return db.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

/**
 * Fetch a single order by its Square order ID.
 */
export async function getOrderBySquareOrderId(squareOrderId: string) {
  return db.order.findUnique({
    where: { squareOrderId },
    include: { items: true },
  });
}

/**
 * Count all orders.
 */
export const getOrderCount = cache(async () => {
  return db.order.count();
});

/**
 * Calculate total revenue from the last 30 days.
 */
export const getRecentRevenue = cache(async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db.order.aggregate({
    _sum: { amountTotal: true },
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: "completed",
    },
  });

  return result._sum.amountTotal ?? 0;
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Persist a new order with its line items.
 */
export async function createOrder(data: CreateOrderData) {
  const { items, ...orderFields } = data;

  return db.order.create({
    data: {
      ...orderFields,
      items: {
        create: items,
      },
    },
    include: { items: true },
  });
}
