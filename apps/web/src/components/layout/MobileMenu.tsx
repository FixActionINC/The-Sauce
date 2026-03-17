"use client";

import { useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
] as const;

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <nav
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface-elevated transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal={isOpen}
      >
        {/* Close button */}
        <div className="flex items-center justify-end p-6">
          <button
            onClick={onClose}
            className="p-2 text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex flex-1 flex-col gap-2 px-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="px-4 py-3 text-2xl font-semibold uppercase tracking-wider text-text-primary transition-colors hover:bg-surface-overlay hover:text-brand-orange"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="border-t border-surface-overlay p-6">
          <Link
            href="/products"
            onClick={onClose}
            className="btn-primary block w-full text-center text-lg"
          >
            Buy The Sauce
          </Link>
        </div>
      </nav>
    </>
  );
}
