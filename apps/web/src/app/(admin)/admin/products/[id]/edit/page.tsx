import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProductImage } from "@prisma/client";
import { ProductForm } from "@/components/admin/ProductForm";
import ImageManager from "@/components/admin/ImageManager";
import { updateProduct } from "@/lib/actions/products";
import { getProductByIdWithImages } from "@/lib/services/product.service";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProductByIdWithImages(productId);

  if (!product) {
    notFound();
  }

  // Bind the productId to the update action
  const boundUpdateAction = updateProduct.bind(null, productId);

  const imageData = product.images.map((img: ProductImage) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          &larr; Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Edit: {product.name}</h1>
      </div>

      {/* Image Management */}
      <section className="mb-8 rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <h3 className="mb-4 border-b border-surface-overlay pb-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Product Images
        </h3>
        <ImageManager productId={productId} initialImages={imageData} />
      </section>

      <ProductForm product={product} action={boundUpdateAction} />
    </div>
  );
}
