"use client";

import { useActionState, useState, useTransition } from "react";
import type { Testimonial } from "@prisma/client";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type TestimonialActionState,
} from "@/lib/actions/testimonials";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-brand-gold">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add Form
// ---------------------------------------------------------------------------

function AddTestimonialForm() {
  const [state, formAction, isPending] = useActionState(createTestimonial, {});

  return (
    <form action={formAction} className="rounded-xl border border-surface-overlay bg-surface-elevated p-4">
      <h3 className="mb-4 text-sm font-semibold text-text-secondary">
        Add New Testimonial
      </h3>

      {state.error && (
        <div className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          Testimonial added.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="add-name" className="mb-1 block text-xs font-medium text-text-secondary">
            Name *
          </label>
          <input
            id="add-name"
            name="name"
            required
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
          />
        </div>
        <div>
          <label htmlFor="add-title" className="mb-1 block text-xs font-medium text-text-secondary">
            Title
          </label>
          <input
            id="add-title"
            name="title"
            placeholder="BBQ Enthusiast"
            className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="add-quote" className="mb-1 block text-xs font-medium text-text-secondary">
            Quote *
          </label>
          <textarea
            id="add-quote"
            name="quote"
            required
            rows={3}
            placeholder="This sauce changed my life..."
            className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
          />
        </div>
        <div>
          <label htmlFor="add-image" className="mb-1 block text-xs font-medium text-text-secondary">
            Image URL
          </label>
          <input
            id="add-image"
            name="imageUrl"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="add-rating" className="mb-1 block text-xs font-medium text-text-secondary">
              Rating
            </label>
            <select
              id="add-rating"
              name="rating"
              defaultValue={5}
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label htmlFor="add-sort" className="mb-1 block text-xs font-medium text-text-secondary">
              Order
            </label>
            <input
              id="add-sort"
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" name="featured" defaultChecked className="accent-brand-orange" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" name="isActive" defaultChecked className="accent-brand-orange" />
            Active
          </label>
          <div className="flex-1" />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-4 py-2 text-sm font-semibold text-text-primary transition-opacity disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add Testimonial"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Edit Row
// ---------------------------------------------------------------------------

function TestimonialRow({ testimonial }: { testimonial: Testimonial }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const boundUpdate = updateTestimonial.bind(null, testimonial.id);
  const [state, formAction, isPending] = useActionState(boundUpdate, {});

  function handleDelete() {
    if (!confirm(`Delete testimonial from "${testimonial.name}"?`)) return;
    startDeleteTransition(async () => {
      const result = await deleteTestimonial(testimonial.id);
      if (result.error) alert(result.error);
    });
  }

  if (state.success && isEditing) {
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <tr className="bg-surface-elevated">
        <td colSpan={6} className="px-4 py-3">
          <form action={formAction} className="grid gap-3 sm:grid-cols-2">
            {state.error && (
              <div className="sm:col-span-2 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                {state.error}
              </div>
            )}
            <div>
              <input name="name" required defaultValue={testimonial.name} placeholder="Name"
                className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange" />
            </div>
            <div>
              <input name="title" defaultValue={testimonial.title ?? ""} placeholder="Title"
                className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange" />
            </div>
            <div className="sm:col-span-2">
              <textarea name="quote" required rows={2} defaultValue={testimonial.quote}
                className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange" />
            </div>
            <div>
              <input name="imageUrl" type="url" defaultValue={testimonial.imageUrl ?? ""} placeholder="Image URL"
                className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange" />
            </div>
            <div className="flex gap-3">
              <select name="rating" defaultValue={testimonial.rating}
                className="rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                ))}
              </select>
              <input name="sortOrder" type="number" defaultValue={testimonial.sortOrder}
                className="w-20 rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange" />
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" name="featured" defaultChecked={testimonial.featured} className="accent-brand-orange" />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" name="isActive" defaultChecked={testimonial.isActive} className="accent-brand-orange" />
                Active
              </label>
              <div className="flex-1" />
              <button type="submit" disabled={isPending}
                className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-3 py-2 text-xs font-semibold text-text-primary disabled:opacity-50">
                {isPending ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setIsEditing(false)}
                className="rounded-lg border border-surface-overlay px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary">
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-surface transition-colors hover:bg-surface-elevated/50">
      <td className="px-4 py-3 text-sm text-text-primary">{testimonial.name}</td>
      <td className="max-w-xs truncate px-4 py-3 text-sm text-text-secondary">{testimonial.quote}</td>
      <td className="px-4 py-3 text-sm"><StarDisplay rating={testimonial.rating} /></td>
      <td className="px-4 py-3">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
          testimonial.featured ? "bg-brand-orange/20 text-brand-orange" : "bg-surface-overlay text-text-secondary"
        }`}>
          {testimonial.featured ? "Yes" : "No"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
          testimonial.isActive ? "bg-green-500/20 text-green-400" : "bg-surface-overlay text-text-secondary"
        }`}>
          {testimonial.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setIsEditing(true)}
            className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-brand-orange/40 hover:text-text-primary">
            Edit
          </button>
          <button onClick={handleDelete} disabled={isDeleting}
            className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-brand-red transition-colors hover:border-brand-red/40 disabled:opacity-50">
            {isDeleting ? "..." : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TestimonialsManager({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="space-y-6">
      <AddTestimonialForm />

      <div className="overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Quote</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Rating</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Featured</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {testimonials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No testimonials yet. Add one above.
                </td>
              </tr>
            )}
            {testimonials.map((t) => (
              <TestimonialRow key={t.id} testimonial={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
