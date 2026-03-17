"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MobileMenu } from "./MobileMenu";
import { useCartStore } from "@/stores/cart";
import { brand } from "@/lib/brand";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalItems = useCartStore((s) => s.totalItems);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const displayCount = mounted ? totalItems : 0;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface">
        <Container className="flex h-20 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center">
            <Image
              src={brand.logo}
              alt="The Sauce"
              width={120}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side: cart + mobile hamburger */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openDrawer}
              className="relative p-2 text-text-secondary transition-colors hover:text-text-primary"
              aria-label={`Shopping cart${displayCount > 0 ? `, ${displayCount} items` : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              <AnimatePresence>
                {displayCount > 0 && (
                  <motion.span
                    key={displayCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center bg-brand-red text-[10px] font-bold text-white"
                  >
                    {displayCount > 99 ? "99+" : displayCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-text-secondary transition-colors hover:text-text-primary md:hidden"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
