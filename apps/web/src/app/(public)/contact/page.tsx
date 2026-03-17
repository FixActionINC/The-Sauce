import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/api/site-settings";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with The Sauce team. We would love to hear from you.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <main className="section-padding min-h-screen">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-orange">
          Get In Touch
        </p>
        <h1 className="font-heading mt-4 text-4xl font-bold md:text-5xl">
          Contact Us
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Have a question, wholesale inquiry, or just want to say hello? Drop us
          a line and we will get back to you.
        </p>

        {settings?.contactEmail && (
          <p className="mt-2 text-sm text-text-secondary">
            Or email us directly at{" "}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="text-brand-orange transition-colors hover:text-brand-gold"
            >
              {settings.contactEmail}
            </a>
          </p>
        )}

        {/* Contact Form */}
        <ContactForm />
      </div>
    </main>
  );
}
