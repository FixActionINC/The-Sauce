import Link from "next/link";
import Image from "next/image";
import type { SocialLink } from "@prisma/client";
import { Container } from "@/components/ui/Container";
import { getSocialLinks, getSiteSettings } from "@/lib/api/site-settings";
import { brand } from "@/lib/brand";
import { sanitize } from "@/lib/sanitize";

const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "Products", href: "/products" },
      { label: "The Sauce", href: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Shipping", href: "/shipping" },
    ],
  },
] as const;

function SocialIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "twitter":
    case "x":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case "youtube":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
  }
}

export async function Footer() {
  const [socialLinks, settings] = await Promise.all([
    getSocialLinks(),
    getSiteSettings(),
  ]);

  return (
    <footer>
      <Container className="py-8">
        {/* Top: Brand + tagline */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <Image
              src={brand.logo}
              alt="The Sauce"
              width={100}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
            The sweet &amp; tangy gourmet everything sauce. Bold. Authentic.
            Versatile. Crafted from a family BBQ recipe by Tyrone Jones.
          </p>
          <Image
            src={brand.poweredBy}
            alt="Powered by Tyrone Jones"
            width={160}
            height={24}
            className="mt-4 h-5 w-auto opacity-60"
          />
        </div>

        {/* Middle: Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="mt-8 flex items-center gap-4 border-t border-surface-overlay pt-6">
            {socialLinks.map((link: SocialLink) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-text-secondary transition-colors hover:text-text-primary"
                aria-label={`Follow us on ${link.platform}`}
              >
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
        )}

        {/* Footer text from settings (HTML) */}
        {settings?.footerText && (
          <div
            className="mt-6 border-t border-surface-overlay pt-6 text-xs text-text-secondary"
            dangerouslySetInnerHTML={{ __html: sanitize(settings.footerText) }}
          />
        )}

        {/* Bottom: Copyright */}
        <div className="mt-6 border-t border-surface-overlay pt-6">
          <p className="text-xs text-text-secondary">
            &copy; {new Date().getFullYear()}{" "}
            {settings?.siteName ?? "The Sauce by Tyrone Jones"}. All rights
            reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
