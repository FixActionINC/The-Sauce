"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createSocialLink as svcCreateSocialLink,
  updateSocialLink as svcUpdateSocialLink,
  deleteSocialLink as svcDeleteSocialLink,
} from "@/lib/services/settings.service";

const socialLinkSchema = z.object({
  platform: z.enum([
    "instagram",
    "facebook",
    "twitter",
    "tiktok",
    "youtube",
    "amazon",
  ]),
  url: z.string().url("A valid URL is required"),
  sortOrder: z.coerce.number().int().default(0),
});

export interface SocialActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createSocialLink(
  _prevState: SocialActionState,
  formData: FormData
): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = {
    platform: formData.get("platform"),
    url: formData.get("url"),
    sortOrder: formData.get("sortOrder"),
  };

  const parsed = socialLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await svcCreateSocialLink({
      platform: parsed.data.platform,
      url: parsed.data.url,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (err) {
    console.error("Failed to create social link:", err);
    return { error: "Failed to create social link." };
  }

  revalidatePath("/admin/social");
  revalidatePath("/");
  return { success: true };
}

export async function updateSocialLink(
  linkId: number,
  _prevState: SocialActionState,
  formData: FormData
): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = {
    platform: formData.get("platform"),
    url: formData.get("url"),
    sortOrder: formData.get("sortOrder"),
  };

  const parsed = socialLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await svcUpdateSocialLink(linkId, {
      platform: parsed.data.platform,
      url: parsed.data.url,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (err) {
    console.error("Failed to update social link:", err);
    return { error: "Failed to update social link." };
  }

  revalidatePath("/admin/social");
  revalidatePath("/");
  return { success: true };
}

export async function deleteSocialLink(
  linkId: number
): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    await svcDeleteSocialLink(linkId);
  } catch (err) {
    console.error("Failed to delete social link:", err);
    return { error: "Failed to delete social link." };
  }

  revalidatePath("/admin/social");
  revalidatePath("/");
  return { success: true };
}
