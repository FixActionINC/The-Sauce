"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { updateSiteSettings } from "@/lib/services/settings.service";

const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(200),
  siteDescription: z.string().max(1000).optional().default(""),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  announcementMessage: z.string().max(500).optional().default(""),
  announcementLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  announcementActive: z.coerce.boolean().default(false),
  footerText: z.string().max(2000).optional().default(""),
  shippingNote: z.string().max(500).optional().default(""),
  defaultMetaTitle: z.string().max(200).optional().default(""),
  defaultMetaDescription: z.string().max(500).optional().default(""),
  heroVideoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export interface SettingsActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function updateSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    raw[key] = value;
  }
  raw.announcementActive =
    formData.get("announcementActive") === "on" ||
    formData.get("announcementActive") === "true";

  const parsed = settingsSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Validation failed. Please check the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateSiteSettings({
      siteName: parsed.data.siteName,
      siteDescription: parsed.data.siteDescription || null,
      contactEmail: parsed.data.contactEmail || null,
      announcementMessage: parsed.data.announcementMessage || null,
      announcementLink: parsed.data.announcementLink || null,
      announcementActive: parsed.data.announcementActive,
      footerText: parsed.data.footerText || null,
      shippingNote: parsed.data.shippingNote || null,
      defaultMetaTitle: parsed.data.defaultMetaTitle || null,
      defaultMetaDescription: parsed.data.defaultMetaDescription || null,
      heroVideoUrl: parsed.data.heroVideoUrl || null,
    });
  } catch (err) {
    console.error("Failed to update settings:", err);
    return { error: "Failed to update settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}
