"use client";

import { useActionState } from "react";
import type { SiteSettings } from "@prisma/client";
import { updateSettings, type SettingsActionState } from "@/lib/actions/settings";

type SettingsData = SiteSettings | null;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-surface-overlay pb-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">
      {children}
    </h3>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="mt-1 text-xs text-brand-red">{errors[0]}</p>;
}

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const [state, formAction, isPending] = useActionState(updateSettings, {});

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Settings saved successfully.
        </div>
      )}

      {/* General */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>General</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="siteName" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Site Name <span className="text-brand-red">*</span>
            </label>
            <input
              id="siteName"
              name="siteName"
              type="text"
              defaultValue={settings?.siteName ?? "The Sauce by Tyrone Jones"}
              required
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
            <FieldError errors={state.fieldErrors?.siteName} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="siteDescription" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Site Description
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              defaultValue={settings?.siteDescription ?? ""}
              rows={3}
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Contact Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={settings?.contactEmail ?? ""}
              placeholder="hello@thesauce.com"
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
            <FieldError errors={state.fieldErrors?.contactEmail} />
          </div>
        </div>
      </section>

      {/* Announcement Bar */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Announcement Bar</SectionHeading>
        <div className="grid gap-4">
          <div>
            <label htmlFor="announcementMessage" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Message
            </label>
            <input
              id="announcementMessage"
              name="announcementMessage"
              type="text"
              defaultValue={settings?.announcementMessage ?? ""}
              placeholder="Free shipping on orders over $50!"
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
          </div>
          <div>
            <label htmlFor="announcementLink" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Link (optional)
            </label>
            <input
              id="announcementLink"
              name="announcementLink"
              type="text"
              defaultValue={settings?.announcementLink ?? ""}
              placeholder="https://example.com/sale"
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
            <FieldError errors={state.fieldErrors?.announcementLink} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="announcementActive"
              defaultChecked={settings?.announcementActive ?? false}
              className="h-4 w-4 rounded border-surface-overlay bg-surface accent-brand-orange"
            />
            <span className="text-sm font-medium text-text-primary">
              Show announcement bar
            </span>
          </label>
        </div>
      </section>

      {/* Footer */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Footer</SectionHeading>
        <div className="grid gap-4">
          <div>
            <label htmlFor="footerText" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Footer Text (HTML)
            </label>
            <textarea
              id="footerText"
              name="footerText"
              defaultValue={settings?.footerText ?? ""}
              rows={3}
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
          </div>
          <div>
            <label htmlFor="shippingNote" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Shipping Note
            </label>
            <input
              id="shippingNote"
              name="shippingNote"
              type="text"
              defaultValue={settings?.shippingNote ?? ""}
              placeholder="Ships within 2-3 business days"
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
          </div>
        </div>
      </section>

      {/* Homepage Media */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>Homepage Media</SectionHeading>
        <div className="grid gap-4">
          <div>
            <label htmlFor="heroVideoUrl" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Video URL (YouTube or direct link)
            </label>
            <input
              id="heroVideoUrl"
              name="heroVideoUrl"
              type="text"
              defaultValue={settings?.heroVideoUrl ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
            <FieldError errors={state.fieldErrors?.heroVideoUrl} />
            <p className="mt-1 text-xs text-text-secondary/60">
              Supports YouTube links or direct video file URLs. Displayed on the homepage.
            </p>
          </div>
        </div>
      </section>

      {/* SEO Defaults */}
      <section className="rounded-xl border border-surface-overlay bg-surface-elevated p-6">
        <SectionHeading>SEO Defaults</SectionHeading>
        <div className="grid gap-4">
          <div>
            <label htmlFor="defaultMetaTitle" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Default Meta Title
            </label>
            <input
              id="defaultMetaTitle"
              name="defaultMetaTitle"
              type="text"
              defaultValue={settings?.defaultMetaTitle ?? ""}
              placeholder="The Sauce by Tyrone Jones"
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
          </div>
          <div>
            <label htmlFor="defaultMetaDescription" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Default Meta Description
            </label>
            <textarea
              id="defaultMetaDescription"
              name="defaultMetaDescription"
              defaultValue={settings?.defaultMetaDescription ?? ""}
              rows={2}
              className="w-full rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-orange"
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-brand-red to-brand-orange px-6 py-2.5 text-sm font-semibold text-text-primary transition-opacity disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
