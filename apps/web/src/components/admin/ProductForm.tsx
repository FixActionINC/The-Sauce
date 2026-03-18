"use client";

import { useActionState } from "react";
import type { Product } from "@prisma/client";
import type { ProductActionState } from "@/lib/actions/products";

type ProductData = Omit<Product, "createdAt" | "updatedAt"> | null;

const CATEGORIES = [
  { value: "original", label: "Original" },
  { value: "hot", label: "Hot" },
  { value: "mild", label: "Mild" },
  { value: "limited-edition", label: "Limited Edition" },
  { value: "bundle", label: "Bundle" },
] as const;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-brand-red">{errors[0]}</p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-surface-overlay pb-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">
      {children}
    </h3>
  );
}

function InputField({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-brand-red"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        step={type === "number" ? "any" : undefined}
        className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-brand-orange"
      />
      <FieldError errors={errors} />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
  errors,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-brand-orange"
      />
      <FieldError errors={errors} />
    </div>
  );
}

function CheckboxField({
  label,
  name,
  defaultChecked,
  description,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-surface-overlay bg-surface accent-brand-orange"
      />
      <div>
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description && (
          <p className="text-xs text-text-secondary">{description}</p>
        )}
      </div>
    </label>
  );
}

export function ProductForm({
  product,
  action,
}: {
  product: ProductData;
  action: (prevState: ProductActionState, formData: FormData) => Promise<ProductActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const isEdit = product !== null;

  return (
    <form action={formAction} className="space-y-8">
      {/* Global messages */}
      {state.error && (
        <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Product saved successfully.
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Basic Info</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            name="name"
            defaultValue={product?.name}
            placeholder="The Original Sauce"
            required
            errors={state.fieldErrors?.name}
          />
          <InputField
            label="Slug"
            name="slug"
            defaultValue={product?.slug}
            placeholder="the-original-sauce"
            required
            errors={state.fieldErrors?.slug}
          />
          <div className="sm:col-span-2">
            <InputField
              label="Tagline"
              name="tagline"
              defaultValue={product?.tagline}
              placeholder="The one that started it all."
              errors={state.fieldErrors?.tagline}
            />
          </div>
          <div className="sm:col-span-2">
            <InputField
              label="Short Description"
              name="shortDescription"
              defaultValue={product?.shortDescription}
              placeholder="A brief product summary"
              errors={state.fieldErrors?.shortDescription}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Description (HTML)"
              name="description"
              defaultValue={product?.description}
              placeholder="<p>Full product description...</p>"
              rows={5}
              errors={state.fieldErrors?.description}
            />
          </div>
          <div>
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={product?.category ?? "original"}
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <InputField
            label="Sort Order"
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
            errors={state.fieldErrors?.sortOrder}
          />
        </div>
      </section>

      {/* Pricing & Inventory */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Pricing &amp; Inventory</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Price"
            name="price"
            type="number"
            defaultValue={product?.price != null ? Number(product.price) : undefined}
            placeholder="12.99"
            required
            errors={state.fieldErrors?.price}
          />
          <InputField
            label="Compare At Price"
            name="compareAtPrice"
            type="number"
            defaultValue={product?.compareAtPrice != null ? Number(product.compareAtPrice) : undefined}
            placeholder="15.99"
            errors={state.fieldErrors?.compareAtPrice}
          />
          <InputField
            label="Stock"
            name="stock"
            type="number"
            defaultValue={product?.stock ?? 0}
            errors={state.fieldErrors?.stock}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InputField
            label="Low Stock Threshold"
            name="lowStockThreshold"
            type="number"
            defaultValue={product?.lowStockThreshold ?? 10}
            placeholder="10"
            errors={state.fieldErrors?.lowStockThreshold}
          />
          <div className="flex items-end">
            <CheckboxField
              label="Auto-disable When Out of Stock"
              name="autoDisableWhenOutOfStock"
              defaultChecked={product?.autoDisableWhenOutOfStock ?? false}
              description="Automatically hide when stock reaches 0"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InputField
            label="Square Catalog ID"
            name="squareCatalogId"
            defaultValue={product?.squareCatalogId}
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
          />
          <InputField
            label="Square Variation ID"
            name="squareVariationId"
            defaultValue={product?.squareVariationId}
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
          />
        </div>
      </section>

      {/* Details */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Details</SectionHeading>
        <div className="grid gap-4">
          <TextAreaField
            label="Ingredients"
            name="ingredients"
            defaultValue={product?.ingredients}
            placeholder="Tomato paste, vinegar, brown sugar..."
          />
          <TextAreaField
            label='Features (JSON array, e.g. ["Gluten-Free", "No Preservatives"])'
            name="features"
            defaultValue={product?.features}
            placeholder='["Gluten-Free", "No Preservatives", "Small Batch"]'
          />
        </div>
      </section>

      {/* SEO */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>SEO</SectionHeading>
        <div className="grid gap-4">
          <InputField
            label="Meta Title"
            name="metaTitle"
            defaultValue={product?.metaTitle}
            placeholder="Product meta title"
            errors={state.fieldErrors?.metaTitle}
          />
          <TextAreaField
            label="Meta Description"
            name="metaDescription"
            defaultValue={product?.metaDescription}
            placeholder="Product meta description"
            rows={2}
            errors={state.fieldErrors?.metaDescription}
          />
        </div>
      </section>

      {/* Nutrition */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Nutrition Facts</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Serving Size"
            name="servingSize"
            defaultValue={product?.servingSize}
            placeholder="2 tbsp (30g)"
          />
          <InputField
            label="Calories"
            name="calories"
            type="number"
            defaultValue={product?.calories}
            placeholder="50"
          />
          <InputField
            label="Total Fat"
            name="totalFat"
            defaultValue={product?.totalFat}
            placeholder="0g"
          />
          <InputField
            label="Sodium"
            name="sodium"
            defaultValue={product?.sodium}
            placeholder="310mg"
          />
          <InputField
            label="Total Carbs"
            name="totalCarbs"
            defaultValue={product?.totalCarbs}
            placeholder="12g"
          />
          <InputField
            label="Sugars"
            name="sugars"
            defaultValue={product?.sugars}
            placeholder="10g"
          />
          <InputField
            label="Protein"
            name="protein"
            defaultValue={product?.protein}
            placeholder="0g"
          />
        </div>
      </section>

      {/* Visibility */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Visibility</SectionHeading>
        <div className="flex flex-col gap-4">
          <CheckboxField
            label="Active"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            description="Product is visible on the storefront."
          />
          <CheckboxField
            label="Featured"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
            description="Highlighted on the homepage."
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-6 py-2.5 text-sm font-semibold text-text-primary transition-opacity disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : isEdit
              ? "Update Product"
              : "Create Product"}
        </button>
        <a
          href="/admin/products"
          className="rounded-lg border border-surface-overlay px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
