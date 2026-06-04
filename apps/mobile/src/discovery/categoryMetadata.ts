import type { Service } from "../types/booking";
import type { Company } from "../types/company";

export function getProviderCategoryLabel(company: Company): string {
  const offeredCategories = company.offered_categories ?? [];
  return offeredCategories.length > 0
    ? offeredCategories.slice(0, 2).map((category) => category.name).join(" & ")
    : "Local care";
}

export function getServiceCategoryLabel(service: Service): string | null {
  return service.category_name?.trim() || null;
}
