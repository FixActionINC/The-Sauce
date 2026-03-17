import { cache } from "react";
import { db } from "@/lib/db";

export const getTestimonials = cache(async () => {
  return db.testimonial.findMany({
    orderBy: { sortOrder: "asc" },
  });
});

export const getFeaturedTestimonials = cache(async () => {
  return db.testimonial.findMany({
    where: { featured: true, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
});

export const getTestimonialById = cache(async (id: number) => {
  return db.testimonial.findUnique({ where: { id } });
});

export const getTestimonialCount = cache(async () => {
  return db.testimonial.count();
});

export function createTestimonial(data: {
  name: string;
  title?: string;
  quote: string;
  imageUrl?: string;
  rating?: number;
  featured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return db.testimonial.create({ data });
}

export function updateTestimonial(
  id: number,
  data: {
    name?: string;
    title?: string | null;
    quote?: string;
    imageUrl?: string | null;
    rating?: number;
    featured?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  return db.testimonial.update({ where: { id }, data });
}

export function deleteTestimonial(id: number) {
  return db.testimonial.delete({ where: { id } });
}
