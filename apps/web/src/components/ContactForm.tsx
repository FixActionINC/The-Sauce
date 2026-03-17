"use client";

import { useActionState } from "react";
import {
  submitContactForm,
  type ContactFormState,
} from "@/lib/actions/contact";

const initialState: ContactFormState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState
  );

  if (state.success) {
    return (
      <div className="mt-12 border border-brand-gold/30 bg-brand-gold/10 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-brand-gold">
          Thank you! We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-12 space-y-6">
      {state.error && !state.fieldErrors && (
        <div className="border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {state.error}
        </div>
      )}

      {/* Honeypot field -- hidden from real users, bots will fill it in */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Your name"
          className="w-full border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          className="w-full border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        {state.fieldErrors?.email && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="What's on your mind?"
          className="w-full resize-none border border-surface-overlay bg-surface-elevated px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        {state.fieldErrors?.message && (
          <p className="text-sm text-brand-red mt-1">
            {state.fieldErrors.message[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
