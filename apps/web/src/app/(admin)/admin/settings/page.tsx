import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/services/settings.service";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold">Site Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage global site configuration.
      </p>

      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
