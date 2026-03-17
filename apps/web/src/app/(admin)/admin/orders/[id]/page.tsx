import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/services/order.service";

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function parseShippingAddress(raw: string | null): ShippingAddress | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return null;
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (Number.isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const address = parseShippingAddress(order.shippingAddress);
  const subtotal = order.items.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
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
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Orders
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      <p className="mt-1 text-sm text-text-secondary">
        {new Date(order.createdAt).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Customer info */}
        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-text-secondary">
            Customer
          </h2>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-medium text-text-primary">
              {order.customerName ?? "N/A"}
            </p>
            <p className="text-text-secondary">
              {order.customerEmail ?? "N/A"}
            </p>
          </div>
        </div>

        {/* Shipping info */}
        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-text-secondary">
            Shipping
          </h2>
          <div className="mt-3 space-y-1 text-sm">
            {order.shippingName && (
              <p className="font-medium text-text-primary">
                {order.shippingName}
              </p>
            )}
            {address ? (
              <>
                {address.line1 && (
                  <p className="text-text-secondary">{address.line1}</p>
                )}
                {address.line2 && (
                  <p className="text-text-secondary">{address.line2}</p>
                )}
                <p className="text-text-secondary">
                  {[address.city, address.state, address.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {address.country && (
                  <p className="text-text-secondary">{address.country}</p>
                )}
              </>
            ) : (
              <p className="text-text-secondary">No shipping address</p>
            )}
          </div>
        </div>

        {/* Payment info */}
        <div className="rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-text-secondary">
            Payment
          </h2>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-text-secondary">
              Order ID:{" "}
              <span className="font-mono text-xs text-text-primary">
                {order.squareOrderId.slice(0, 24)}...
              </span>
            </p>
            {order.squarePaymentId && (
              <p className="text-text-secondary">
                Payment ID:{" "}
                <span className="font-mono text-xs text-text-primary">
                  {order.squarePaymentId.slice(0, 24)}...
                </span>
              </p>
            )}
            <p className="text-text-secondary">
              Currency:{" "}
              <span className="uppercase text-text-primary">
                {order.currency}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Product
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Qty
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {order.items.map((item) => (
              <tr
                key={item.id}
                className="bg-surface transition-colors hover:bg-surface-elevated/50"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  {item.productName}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-secondary">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-secondary">
                  {formatCents(item.unitAmount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                  {formatCents(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-2 rounded-xl border border-surface-overlay bg-surface-elevated p-5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="tabular-nums text-text-primary">
              {formatCents(subtotal)}
            </span>
          </div>
          {order.shippingAmount != null && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Shipping</span>
              <span className="tabular-nums text-text-primary">
                {formatCents(order.shippingAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-surface-overlay pt-2 text-sm font-semibold">
            <span className="text-text-primary">Total</span>
            <span className="tabular-nums text-text-primary">
              {formatCents(order.amountTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        Completed
      </span>
    );
  }

  if (status === "refunded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-xs font-medium text-brand-orange">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        Refunded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
      {status}
    </span>
  );
}
