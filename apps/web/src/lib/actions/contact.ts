"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createContactMessage } from "@/lib/services/contact.service";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
  website: z.string().optional(), // honeypot
});

// ---------------------------------------------------------------------------
// In-memory rate limiting -- 3 submissions per 15 minutes per IP
// ---------------------------------------------------------------------------

const CONTACT_MAX_ATTEMPTS = 3;
const CONTACT_WINDOW_MS = 15 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const contactAttempts = new Map<string, RateLimitEntry>();

function getClientIp(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

function isContactRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = contactAttempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    contactAttempts.set(ip, { count: 1, resetAt: now + CONTACT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > CONTACT_MAX_ATTEMPTS;
}

if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of contactAttempts) {
      if (now >= entry.resetAt) contactAttempts.delete(ip);
    }
  }, CONTACT_WINDOW_MS).unref();
}

export interface ContactFormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website"),
  };

  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Honeypot: if the hidden "website" field is filled, it is a bot
  if (parsed.data.website) {
    return { success: true };
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  if (isContactRateLimited(ip)) {
    return { error: "Too many submissions. Please try again later." };
  }

  try {
    await createContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });
  } catch (err) {
    console.error("Failed to save contact message:", err);
    return { error: "Failed to send message. Please try again." };
  }

  return { success: true };
}
