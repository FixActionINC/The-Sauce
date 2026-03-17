import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "The Sauce by Tyrone Jones | Premium BBQ Sauce",
    template: "%s | The Sauce by Tyrone Jones",
  },
  description:
    "Bold, authentic, versatile. The sweet and tangy gourmet everything sauce crafted from a family BBQ recipe. Gluten-free. No fillers. From BBQ to breakfast and everything in between.",
  keywords: [
    "BBQ sauce",
    "barbecue sauce",
    "Tyrone Jones",
    "The Sauce",
    "gluten-free BBQ sauce",
    "gourmet sauce",
    "everything sauce",
  ],
  authors: [{ name: "Tyrone Jones" }],
  creator: "The Sauce by Tyrone Jones",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "The Sauce by Tyrone Jones",
    title: "The Sauce by Tyrone Jones | Premium BBQ Sauce",
    description:
      "Bold, authentic, versatile. The sweet and tangy gourmet everything sauce from a family BBQ recipe.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sauce by Tyrone Jones",
    description:
      "Bold, authentic, versatile. The sweet and tangy gourmet everything sauce from a family BBQ recipe.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-text-primary font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteJsonLd()),
          }}
        />
        {children}
      </body>
    </html>
  );
}
