import Link from "next/link";
import {
  getProductCount,
  getActiveProductCount,
  getTotalInventory,
  getLowStockProducts,
  getOutOfStockProducts,
} from "@/lib/services/product.service";
import {
  getOrderCount,
  getRevenueStats,
  getDailyRevenue,
  getTopSellingProducts,
  getRevenueByCategorySummary,
} from "@/lib/services/order.service";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import TopProductsChart from "@/components/admin/charts/TopProductsChart";
import CategoryChart from "@/components/admin/charts/CategoryChart";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDollars(dollars: number): string {
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    activeProducts,
    totalInventory,
    totalOrders,
    lowStockProducts,
    outOfStockProducts,
    revenueStats,
    dailyRevenue,
    topProducts,
    categoryRevenue,
  ] = await Promise.all([
    getProductCount(),
    getActiveProductCount(),
    getTotalInventory(),
    getOrderCount(),
    getLowStockProducts(),
    getOutOfStockProducts(),
    getRevenueStats(),
    getDailyRevenue(30),
    getTopSellingProducts(5),
    getRevenueByCategorySummary(),
  ]);

  const hasInventoryAlerts =
    lowStockProducts.length > 0 || outOfStockProducts.length > 0;

  const monthChange = percentChange(
    revenueStats.thisMonthRevenue,
    revenueStats.lastMonthRevenue,
  );

  const quickLinks = [
    { label: "Add New Product", href: "/admin/products/new" },
    { label: "View Orders", href: "/admin/orders" },
    { label: "Edit Site Settings", href: "/admin/settings" },
    { label: "Manage Social Links", href: "/admin/social" },
    { label: "View All Products", href: "/admin/products" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Overview of your store.
      </p>

      {/* Row 1: Key Metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <p className="text-sm font-medium text-text-secondary">
            Total Revenue
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {formatCents(revenueStats.totalRevenue)}
          </p>
        </div>

        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <p className="text-sm font-medium text-text-secondary">This Month</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {formatCents(revenueStats.thisMonthRevenue)}
          </p>
          {monthChange !== null && (
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                monthChange >= 0
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {monthChange >= 0 ? "+" : ""}
              {monthChange}% vs last month
            </span>
          )}
        </div>

        <Link
          href="/admin/orders"
          className="rounded-xl border border-surface-overlay bg-surface-elevated p-5 transition-colors hover:border-brand-orange/30"
        >
          <p className="text-sm font-medium text-text-secondary">
            Total Orders
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{totalOrders}</p>
        </Link>

        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <p className="text-sm font-medium text-text-secondary">
            Avg Order Value
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {formatCents(revenueStats.avgOrderValue)}
          </p>
        </div>
      </div>

      {/* Row 2: Revenue Trend (full width) */}
      <div className="mt-6 rounded-xl border border-surface-overlay bg-surface-elevated p-5">
        <h2 className="text-lg font-semibold">Revenue (Last 30 Days)</h2>
        <div className="mt-4">
          <RevenueChart data={dailyRevenue} />
        </div>
      </div>

      {/* Row 3: Top Products + Category Breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <h2 className="text-lg font-semibold">Top Products</h2>
          <div className="mt-4">
            <TopProductsChart data={topProducts} />
          </div>
        </div>

        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <h2 className="text-lg font-semibold">Sales by Category</h2>
          <div className="mt-4">
            <CategoryChart data={categoryRevenue} />
          </div>
        </div>
      </div>

      {/* Row 4: Inventory Alerts */}
      {hasInventoryAlerts && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Inventory Alerts</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {outOfStockProducts.length > 0 && (
              <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-5">
                <p className="text-sm font-medium text-brand-red">
                  Out of Stock
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-brand-red">
                  {outOfStockProducts.length}
                </p>
                <ul className="mt-3 space-y-1">
                  {outOfStockProducts.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-sm text-brand-red hover:underline"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                  {outOfStockProducts.length > 5 && (
                    <li className="text-xs text-brand-red/70">
                      +{outOfStockProducts.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/10 p-5">
                <p className="text-sm font-medium text-brand-orange">
                  Low Stock
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-brand-orange">
                  {lowStockProducts.length}
                </p>
                <ul className="mt-3 space-y-1">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-sm text-brand-orange hover:underline"
                      >
                        {p.name} ({p.stock} left)
                      </Link>
                    </li>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <li className="text-xs text-brand-orange/70">
                      +{lowStockProducts.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 5: Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg border border-surface-overlay bg-surface-elevated px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-brand-orange/30 hover:text-text-primary"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
