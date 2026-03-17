import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions/products";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          &larr; Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New Product</h1>
      </div>

      <ProductForm product={null} action={createProduct} />
    </div>
  );
}
