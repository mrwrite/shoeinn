import type { CareCategory } from "../types/care";
import type { Company } from "../types/company";
import type { Service } from "../types/booking";

export const FALLBACK_CATEGORY_ICON = "sparkles-outline";

const iconByKey: Record<string, string> = {
  footprints: "footsteps-outline",
  shirt: "shirt-outline",
  sparkles: "sparkles-outline",
  briefcase: "bag-handle-outline",
  "layout-grid": "grid-outline",
  scissors: "cut-outline",
};

export function getCategoryIconName(iconKey?: string | null): string {
  return iconKey ? iconByKey[iconKey] ?? FALLBACK_CATEGORY_ICON : FALLBACK_CATEGORY_ICON;
}

export function getVisibleCategories(categories?: CareCategory[] | null): CareCategory[] {
  return (categories ?? [])
    .filter((category) => category.is_active)
    .slice()
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
}

export function companyOffersCategory(company: Company, categorySlug: string | null): boolean {
  if (!categorySlug) return true;
  return Boolean(company.offered_categories?.some((category) => category.slug === categorySlug));
}

export function filterCompaniesByCategory(companies: Company[], categorySlug: string | null): Company[] {
  return companies.filter((company) => companyOffersCategory(company, categorySlug));
}

export function serviceMatchesCategory(service: Service, categorySlug: string | null): boolean {
  if (!categorySlug) return true;
  return service.category_slug === categorySlug;
}

export function filterServicesByCategory(services: Service[], categorySlug: string | null): Service[] {
  return services.filter((service) => serviceMatchesCategory(service, categorySlug));
}

export function getCategoryEmptyMessage(category?: CareCategory | null): string {
  if (!category) return "Adjust filters or try a new search.";
  return `No providers are offering ${category.name.toLowerCase()} in this area yet.`;
}
