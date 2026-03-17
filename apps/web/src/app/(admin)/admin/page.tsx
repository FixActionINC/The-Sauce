import Link from "next/link";
import {
  getProductCount,
  getActiveProductCount,
  getTotalInventory,
} from "@/lib/services/product.service";
import { getOrderCount } from "@/lib/services/order.service";

export default async function AdminDashboardPage() {
  const [totalProducts, activeProducts, totalInventory, totalOrders] =
    await Promise.all([
      getProductCount(),
      getActiveProductCount(),
      getTotalInventory(),
      getOrderCount(),
    ]);

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      href: "/admin/products",
    },
    {
      label: "Active Products",
      value: activeProducts,
      href: "/admin/products",
    },
    {
      label: "Total Inventory",
      value: totalInventory,
      href: "/admin/products",
    },
    {
      label: "Total Orders",
      value: totalOrders,
      href: "/admin/orders",
    },
  ];

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

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-surface-overlay bg-surface-elevated p-5 transition-colors hover:border-brand-orange/30"
          >
            <p className="text-sm font-medium text-text-secondary">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
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
