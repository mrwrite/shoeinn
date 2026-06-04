import { getProviderCategoryLabel, getServiceCategoryLabel } from "../discovery/categoryMetadata";
import type { Company } from "../types/company";
import type { Service } from "../types/booking";

describe("category metadata labels", () => {
  it("summarizes provider offered categories without shoe-only fallback copy", () => {
    const company: Company = {
      id: "company-1",
      name: "Premium Care Co",
      offered_categories: [
        { id: "cat-1", slug: "laundry", name: "Laundry", icon_key: "shirt" },
        { id: "cat-2", slug: "dry-cleaning", name: "Dry Cleaning", icon_key: "sparkles" },
        { id: "cat-3", slug: "rugs-textiles", name: "Rugs & Textiles", icon_key: "layout-grid" },
      ],
    };

    expect(getProviderCategoryLabel(company)).toBe("Laundry & Dry Cleaning");
    expect(getProviderCategoryLabel({ id: "legacy", name: "Legacy Provider" })).toBe("Local care");
  });

  it("returns service category labels only when category metadata is present", () => {
    const service: Service = {
      id: "svc-1",
      company_id: "company-1",
      category_slug: "handbags-leather",
      category_name: "Handbags & Leather",
      category_icon_key: "briefcase",
      name: "Designer Handbag Refresh",
      slug: "designer-handbag-refresh",
      description: "Premium leather care.",
      duration_minutes: 75,
      price_cents: 8800,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    expect(getServiceCategoryLabel(service)).toBe("Handbags & Leather");
    expect(getServiceCategoryLabel({ ...service, category_name: "   " })).toBeNull();
  });
});
