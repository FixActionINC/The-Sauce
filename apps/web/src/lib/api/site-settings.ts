/**
 * Site settings data-access layer -- re-exports from the centralized service.
 *
 * Existing consumers can continue importing from `@/lib/api/site-settings`
 * without changes. All database logic lives in the service module.
 */
export {
  getSiteSettings,
  getSocialLinks,
} from "@/lib/services/settings.service";
