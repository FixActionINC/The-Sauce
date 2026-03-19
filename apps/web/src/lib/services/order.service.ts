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
// Analytics Queries
// ---------------------------------------------------------------------------

/**
 * Revenue stats: total, this month, last month, and average order value.
 * All amounts returned in cents.
 */
export const getRevenueStats = cache(async () => {
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalAgg, thisMonthAgg, lastMonthAgg, completedCount] =
    await db.$transaction([
      db.order.aggregate({
        _sum: { amountTotal: true },
        where: { status: "completed" },
      }),
      db.order.aggregate({
        _sum: { amountTotal: true },
        where: {
          status: "completed",
          createdAt: { gte: firstOfThisMonth },
        },
      }),
      db.order.aggregate({
        _sum: { amountTotal: true },
        where: {
          status: "completed",
          createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth },
        },
      }),
      db.order.count({ where: { status: "completed" } }),
    ]);

  const totalRevenue = totalAgg._sum.amountTotal ?? 0;
  const thisMonthRevenue = thisMonthAgg._sum.amountTotal ?? 0;
  const lastMonthRevenue = lastMonthAgg._sum.amountTotal ?? 0;
  const avgOrderValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  return { totalRevenue, thisMonthRevenue, lastMonthRevenue, avgOrderValue };
});

/**
 * Daily revenue and order count for the last N days.
 * Revenue returned in dollars, missing days filled with zeros.
 */
export const getDailyRevenue = cache(async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: {
      status: "completed",
      createdAt: { gte: since },
    },
    select: { amountTotal: true, createdAt: true },
  });

  // Build a map keyed by YYYY-MM-DD
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const existing = byDay.get(key) ?? { revenue: 0, orders: 0 };
    existing.revenue += o.amountTotal / 100; // cents -> dollars
    existing.orders += 1;
    byDay.set(key, existing);
  }

  // Fill in every day in the range
  const result: { date: string; revenue: number; orders: number }[] = [];
  const cursor = new Date(since);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = byDay.get(key) ?? { revenue: 0, orders: 0 };
    result.push({
      date: key,
      revenue: Math.round(entry.revenue * 100) / 100, // 2 decimal places
      orders: entry.orders,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
});

/**
 * Top selling products by revenue. Returns dollars.
 */
export const getTopSellingProducts = cache(async (limit = 5) => {
  const groups = await db.orderItem.groupBy({
    by: ["productName"],
    _sum: { quantity: true, totalAmount: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  return groups.map((g) => ({
    name: g.productName,
    revenue: (g._sum.totalAmount ?? 0) / 100, // cents -> dollars
    quantity: g._sum.quantity ?? 0,
  }));
});

/**
 * Revenue breakdown by product category. Returns dollars.
 * Looks up each order item's product to determine category.
 */
export const getRevenueByCategorySummary = cache(async () => {
  // Get all completed order items with their squareVariationId for product lookup
  const completedItems = await db.orderItem.findMany({
    where: { order: { status: "completed" } },
    select: {
      totalAmount: true,
      squareVariationId: true,
    },
  });

  // Build a lookup from squareVariationId -> category
  const products = await db.product.findMany({
    where: { squareVariationId: { not: null } },
    select: { squareVariationId: true, category: true },
  });
  const variationToCategory = new Map<string, string>();
  for (const p of products) {
    if (p.squareVariationId) {
      variationToCategory.set(p.squareVariationId, p.category);
    }
  }

  // Aggregate revenue by category
  const byCat = new Map<string, number>();
  for (const item of completedItems) {
    const category =
      (item.squareVariationId
        ? variationToCategory.get(item.squareVariationId)
        : null) ?? "Other";
    byCat.set(category, (byCat.get(category) ?? 0) + item.totalAmount);
  }

  return Array.from(byCat.entries()).map(([category, cents]) => ({
    category,
    revenue: cents / 100, // cents -> dollars
  }));
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
