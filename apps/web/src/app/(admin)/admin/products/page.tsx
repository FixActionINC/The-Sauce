import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { getAllProductsForAdmin } from "@/lib/services/product.service";

export default async function AdminProductsPage() {
  const products = await getAllProductsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {products.length} product{products.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-4 py-2 text-sm font-semibold text-text-primary transition-opacity hover:opacity-90"
        >
          Add Product
        </Link>
      </div>

      {/* Product table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Price</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Stock</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Category</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                  No products yet.{" "}
                  <Link href="/admin/products/new" className="text-brand-orange hover:underline">
                    Add your first product
                  </Link>
                </td>
              </tr>
            )}
            {products.map((product: Product & { images: ProductImage[] }) => (
              <tr
                key={product.id}
                className="bg-surface transition-colors hover:bg-surface-elevated/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-text-primary">{product.name}</p>
                      <p className="text-xs text-text-secondary">/{product.slug}</p>
                    </div>
                    {product.isFeatured && (
                      <span className="shrink-0 rounded bg-brand-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-gold">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatPrice(product.price)}
                  {product.compareAtPrice && (
                    <span className="ml-1 text-xs text-text-secondary line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <span
                    className={
                      product.stock <= 0
                        ? "text-brand-red"
                        : product.stock <= 10
                          ? "text-brand-orange"
                          : "text-text-primary"
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-surface-overlay px-2 py-0.5 text-xs text-text-secondary">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {product.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-brand-orange/40 hover:text-text-primary"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
