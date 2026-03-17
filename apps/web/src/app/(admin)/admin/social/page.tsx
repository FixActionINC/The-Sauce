import { SocialLinksManager } from "@/components/admin/SocialLinksManager";
import { getSocialLinks } from "@/lib/services/settings.service";

export default async function AdminSocialPage() {
  const socialLinks = await getSocialLinks();

  return (
    <div>
      <h1 className="text-2xl font-bold">Social Links</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage social media links displayed on the site.
      </p>

      <div className="mt-6">
        <SocialLinksManager links={socialLinks} />
      </div>
    </div>
  );
}
