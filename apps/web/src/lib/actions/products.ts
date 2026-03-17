"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createProduct as svcCreateProduct,
  updateProduct as svcUpdateProduct,
  deleteProduct as svcDeleteProduct,
  isSlugTaken,
} from "@/lib/services/product.service";
import type { ProductCreateData } from "@/lib/services/product.service";

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),
  tagline: z.string().max(300).optional().default(""),
  description: z.string().optional().default(""),
  shortDescription: z.string().max(500).optional().default(""),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("")),
  squareCatalogId: z.string().optional().default(""),
  squareVariationId: z.string().optional().default(""),
  ingredients: z.string().optional().default(""),
  features: z.string().optional().default(""),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  category: z
    .enum(["original", "hot", "mild", "limited-edition", "bundle"])
    .default("original"),
  sortOrder: z.coerce.number().int().default(0),
  metaTitle: z.string().max(200).optional().default(""),
  metaDescription: z.string().max(500).optional().default(""),
  servingSize: z.string().optional().default(""),
  calories: z.coerce.number().int().min(0).optional().or(z.literal("")),
  totalFat: z.string().optional().default(""),
  sodium: z.string().optional().default(""),
  totalCarbs: z.string().optional().default(""),
  sugars: z.string().optional().default(""),
  protein: z.string().optional().default(""),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert validated form data into the shape expected by the product service.
 */
function toServiceData(data: ProductFormData): ProductCreateData {
  return {
    name: data.name,
    slug: data.slug,
    tagline: data.tagline || null,
    description: data.description || null,
    shortDescription: data.shortDescription || null,
    price: data.price,
    compareAtPrice:
      data.compareAtPrice !== "" && data.compareAtPrice !== undefined
        ? Number(data.compareAtPrice)
        : null,
    squareCatalogId: data.squareCatalogId || null,
    squareVariationId: data.squareVariationId || null,
    ingredients: data.ingredients || null,
    features: data.features || null,
    stock: data.stock,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
    category: data.category,
    sortOrder: data.sortOrder,
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
    servingSize: data.servingSize || null,
    calories:
      data.calories !== "" && data.calories !== undefined
        ? Number(data.calories)
        : null,
    totalFat: data.totalFat || null,
    sodium: data.sodium || null,
    totalCarbs: data.totalCarbs || null,
    sugars: data.sugars || null,
    protein: data.protein || null,
  };
}

/**
 * Parse FormData into a raw object for Zod validation.
 */
function formDataToObject(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    raw[key] = value;
  }
  // Checkboxes that are unchecked don't appear in FormData
  raw.isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  raw.isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  return raw;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = formDataToObject(formData);
  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Validation failed. Please check the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Check slug uniqueness
  if (await isSlugTaken(parsed.data.slug)) {
    return {
      error: "A product with this slug already exists.",
      fieldErrors: { slug: ["This slug is already taken."] },
    };
  }

  try {
    await svcCreateProduct(toServiceData(parsed.data));
  } catch (err) {
    console.error("Failed to create product:", err);
    return { error: "Failed to create product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateProduct(
  productId: number,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = formDataToObject(formData);
  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Validation failed. Please check the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Check slug uniqueness (excluding current product)
  if (await isSlugTaken(parsed.data.slug, productId)) {
    return {
      error: "A product with this slug already exists.",
      fieldErrors: { slug: ["This slug is already taken."] },
    };
  }

  try {
    await svcUpdateProduct(productId, toServiceData(parsed.data));
  } catch (err) {
    console.error("Failed to update product:", err);
    return { error: "Failed to update product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProduct(
  productId: number
): Promise<ProductActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    await svcDeleteProduct(productId);
  } catch (err) {
    console.error("Failed to delete product:", err);
    return { error: "Failed to delete product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}
