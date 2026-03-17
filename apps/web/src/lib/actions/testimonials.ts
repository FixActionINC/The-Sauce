"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createTestimonial as svcCreate,
  updateTestimonial as svcUpdate,
  deleteTestimonial as svcDelete,
} from "@/lib/services/testimonial.service";

const testimonialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional().default(""),
  quote: z.string().min(1, "Quote is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  featured: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean().default(false)),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean().default(true)),
  sortOrder: z.coerce.number().int().default(0),
});

export interface TestimonialActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createTestimonial(
  _prevState: TestimonialActionState,
  formData: FormData
): Promise<TestimonialActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = {
    name: formData.get("name"),
    title: formData.get("title"),
    quote: formData.get("quote"),
    imageUrl: formData.get("imageUrl"),
    rating: formData.get("rating"),
    featured: formData.get("featured"),
    isActive: formData.get("isActive"),
    sortOrder: formData.get("sortOrder"),
  };

  const parsed = testimonialSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await svcCreate({
      name: parsed.data.name,
      title: parsed.data.title || undefined,
      quote: parsed.data.quote,
      imageUrl: parsed.data.imageUrl || undefined,
      rating: parsed.data.rating,
      featured: parsed.data.featured,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (err) {
    console.error("Failed to create testimonial:", err);
    return { error: "Failed to create testimonial." };
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { success: true };
}

export async function updateTestimonial(
  id: number,
  _prevState: TestimonialActionState,
  formData: FormData
): Promise<TestimonialActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = {
    name: formData.get("name"),
    title: formData.get("title"),
    quote: formData.get("quote"),
    imageUrl: formData.get("imageUrl"),
    rating: formData.get("rating"),
    featured: formData.get("featured"),
    isActive: formData.get("isActive"),
    sortOrder: formData.get("sortOrder"),
  };

  const parsed = testimonialSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await svcUpdate(id, {
      name: parsed.data.name,
      title: parsed.data.title || null,
      quote: parsed.data.quote,
      imageUrl: parsed.data.imageUrl || null,
      rating: parsed.data.rating,
      featured: parsed.data.featured,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (err) {
    console.error("Failed to update testimonial:", err);
    return { error: "Failed to update testimonial." };
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTestimonial(
  id: number
): Promise<TestimonialActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    await svcDelete(id);
  } catch (err) {
    console.error("Failed to delete testimonial:", err);
    return { error: "Failed to delete testimonial." };
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { success: true };
}
