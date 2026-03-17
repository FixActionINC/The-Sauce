import Link from "next/link";
import { getOrders } from "@/lib/services/order.service";

export default async function AdminOrdersPage() {
  const { items: orders, total } = await getOrders();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} total order{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Order #
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Customer
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Total
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Items
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-text-secondary"
                >
                  No orders yet. Orders will appear here after customers
                  complete checkout.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const itemCount = order.items.reduce(
                (sum, i) => sum + i.quantity,
                0,
              );

              return (
                <tr
                  key={order.id}
                  className="bg-surface transition-colors hover:bg-surface-elevated/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-brand-orange hover:underline"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {order.customerName ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {order.customerEmail ?? "--"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    ${(order.amountTotal / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">
                    {itemCount}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        Completed
      </span>
    );
  }

  if (status === "refunded") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        Refunded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
      {status}
    </span>
  );
}
