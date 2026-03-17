export interface SiteSettings {
  id: number;
  siteName: string;
  siteDescription?: string;
  contactEmail?: string;
  shippingNote?: string;
  footerText?: string; // HTML

  // Announcement bar
  announcementMessage?: string;
  announcementLink?: string;
  announcementActive: boolean;

  // SEO defaults
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
}

export interface SocialLink {
  id: number;
  platform: "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "amazon";
  url: string;
  sortOrder: number;
}
