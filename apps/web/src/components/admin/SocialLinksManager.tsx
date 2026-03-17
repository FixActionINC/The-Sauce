"use client";

import { useActionState, useState, useTransition } from "react";
import type { SocialLink } from "@prisma/client";
import {
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  type SocialActionState,
} from "@/lib/actions/social";

const PLATFORMS = [
  "instagram",
  "facebook",
  "twitter",
  "tiktok",
  "youtube",
  "amazon",
] as const;

function platformLabel(platform: string): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

// ---------------------------------------------------------------------------
// Add Form
// ---------------------------------------------------------------------------

function AddSocialLinkForm() {
  const [state, formAction, isPending] = useActionState(createSocialLink, {});

  return (
    <form action={formAction} className="rounded-xl border border-surface-overlay bg-surface-elevated p-4">
      <h3 className="mb-4 text-sm font-semibold text-text-secondary">
        Add New Link
      </h3>

      {state.error && (
        <div className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          Link added.
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="add-platform" className="mb-1 block text-xs font-medium text-text-secondary">
            Platform
          </label>
          <select
            id="add-platform"
            name="platform"
            className="rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {platformLabel(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="add-url" className="mb-1 block text-xs font-medium text-text-secondary">
            URL
          </label>
          <input
            id="add-url"
            name="url"
            type="url"
            required
            placeholder="https://instagram.com/..."
            className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
          />
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
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-4 py-2 text-sm font-semibold text-text-primary transition-opacity disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Edit Row
// ---------------------------------------------------------------------------

function SocialLinkRow({ link }: { link: SocialLink }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const boundUpdate = updateSocialLink.bind(null, link.id);
  const [state, formAction, isPending] = useActionState(boundUpdate, {});

  function handleDelete() {
    if (!confirm(`Delete ${platformLabel(link.platform)} link?`)) return;
    startDeleteTransition(async () => {
      const result = await deleteSocialLink(link.id);
      if (result.error) alert(result.error);
    });
  }

  // Display success and close editing
  if (state.success && isEditing) {
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <tr className="bg-surface-elevated">
        <td colSpan={4} className="px-4 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            {state.error && (
              <div className="w-full rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                {state.error}
              </div>
            )}
            <div>
              <select
                name="platform"
                defaultValue={link.platform}
                className="rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {platformLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                name="url"
                type="url"
                required
                defaultValue={link.url}
                className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
              />
            </div>
            <div className="w-20">
              <input
                name="sortOrder"
                type="number"
                defaultValue={link.sortOrder}
                className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-orange"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-3 py-2 text-xs font-semibold text-text-primary disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-surface-overlay px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-surface transition-colors hover:bg-surface-elevated/50">
      <td className="px-4 py-3">
        <span className="rounded bg-surface-overlay px-2 py-0.5 text-xs font-medium text-text-secondary">
          {platformLabel(link.platform)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-text-primary">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-orange"
        >
          {link.url}
        </a>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-text-secondary">
        {link.sortOrder}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-brand-orange/40 hover:text-text-primary"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-surface-overlay px-3 py-1 text-xs font-medium text-brand-red transition-colors hover:border-brand-red/40 disabled:opacity-50"
          >
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

export function SocialLinksManager({ links }: { links: SocialLink[] }) {
  return (
    <div className="space-y-6">
      <AddSocialLinkForm />

      {/* Links table */}
      <div className="overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">Platform</th>
              <th className="px-4 py-3 font-medium text-text-secondary">URL</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Order</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {links.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  No social links yet. Add one above.
                </td>
              </tr>
            )}
            {links.map((link) => (
              <SocialLinkRow key={link.id} link={link} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
