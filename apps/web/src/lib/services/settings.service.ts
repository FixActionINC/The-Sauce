import { cache } from "react";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsUpdateData {
  siteName: string;
  siteDescription?: string | null;
  contactEmail?: string | null;
  announcementMessage?: string | null;
  announcementLink?: string | null;
  announcementActive: boolean;
  footerText?: string | null;
  shippingNote?: string | null;
  defaultMetaTitle?: string | null;
  defaultMetaDescription?: string | null;
  heroVideoUrl?: string | null;
}

export interface SocialLinkData {
  platform: string;
  url: string;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Site Settings Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the singleton site settings row (id = 1).
 * Returns null if the row has not been seeded yet.
 */
export const getSiteSettings = cache(async () => {
  return db.siteSettings.findUnique({
    where: { id: 1 },
  });
});

// ---------------------------------------------------------------------------
// Social Links Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all social links, ordered by sortOrder ascending.
 */
export const getSocialLinks = cache(async () => {
  return db.socialLink.findMany({
    orderBy: { sortOrder: "asc" },
  });
});

// ---------------------------------------------------------------------------
// Site Settings Mutations
// ---------------------------------------------------------------------------

/**
 * Upsert site settings (always targets the singleton row id = 1).
 */
export async function updateSiteSettings(data: SettingsUpdateData) {
  return db.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}

// ---------------------------------------------------------------------------
// Social Links Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new social link.
 */
export async function createSocialLink(data: SocialLinkData) {
  return db.socialLink.create({ data });
}

/**
 * Update an existing social link by ID.
 */
export async function updateSocialLink(id: number, data: SocialLinkData) {
  return db.socialLink.update({
    where: { id },
    data,
  });
}

/**
 * Delete a social link by ID.
 */
export async function deleteSocialLink(id: number) {
  return db.socialLink.delete({ where: { id } });
}
