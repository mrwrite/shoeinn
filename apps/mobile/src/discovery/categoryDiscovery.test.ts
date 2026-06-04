import {
  filterCompaniesByCategory,
  filterServicesByCategory,
  getCategoryEmptyMessage,
  getCategoryIconName,
  getVisibleCategories,
} from "./categoryDiscovery";
import type { CareCategory } from "../types/care";
import type { Company } from "../types/company";
import type { Service } from "../types/booking";

const categories: CareCategory[] = [
  {
    id: "2",
    slug: "laundry",
    name: "Laundry",
    icon_key: "shirt",
    display_order: 20,
    is_active: true,
  },
  {
    id: "1",
    slug: "shoes",
    name: "Shoes",
    icon_key: "footprints",
    display_order: 10,
    is_active: true,
  },
  {
    id: "3",
    slug: "alterations",
    name: "Alterations",
    icon_key: "scissors",
    display_order: 30,
    is_active: false,
  },
];

describe("category discovery helpers", () => {
  it("returns active categories ordered by display order", () => {
    expect(getVisibleCategories(categories).map((category) => category.slug)).toEqual(["shoes", "laundry"]);
  });

  it("maps category icon keys to Ionicons names with fallback", () => {
    expect(getCategoryIconName("footprints")).toBe("footsteps-outline");
    expect(getCategoryIconName("unknown")).toBe("sparkles-outline");
    expect(getCategoryIconName(null)).toBe("sparkles-outline");
  });

  it("filters companies by offered category when selected", () => {
    const companies: Company[] = [
      {
        id: "company-shoes",
        name: "ShoeInn",
        offered_categories: [{ id: "1", slug: "shoes", name: "Shoes", icon_key: "footprints" }],
      },
      {
        id: "company-laundry",
        name: "Clean Fold",
        offered_categories: [{ id: "2", slug: "laundry", name: "Laundry", icon_key: "shirt" }],
      },
      {
        id: "company-empty",
        name: "Legacy Provider",
      },
    ];

    expect(filterCompaniesByCategory(companies, null).map((company) => company.id)).toEqual([
      "company-shoes",
      "company-laundry",
      "company-empty",
    ]);
    expect(filterCompaniesByCategory(companies, "laundry").map((company) => company.id)).toEqual([
      "company-laundry",
    ]);
  });

  it("filters provider services by selected category with all-care fallback", () => {
    const services: Service[] = [
      {
        id: "svc-shoes",
        company_id: "company-1",
        category_slug: "shoes",
        category_name: "Shoes",
        name: "Signature Sneaker Deep Clean",
        slug: "signature-sneaker-deep-clean",
        description: "Shoe-specific care.",
        duration_minutes: 60,
        price_cents: 6900,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "svc-laundry",
        company_id: "company-1",
        category_slug: "laundry",
        category_name: "Laundry",
        name: "Wash & Fold Essentials",
        slug: "wash-fold-essentials",
        description: "Laundry care.",
        duration_minutes: 90,
        price_cents: 4200,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    expect(filterServicesByCategory(services, null).map((service) => service.id)).toEqual([
      "svc-shoes",
      "svc-laundry",
    ]);
    expect(filterServicesByCategory(services, "laundry").map((service) => service.id)).toEqual([
      "svc-laundry",
    ]);
    expect(filterServicesByCategory(services, "dry-cleaning")).toEqual([]);
  });

  it("builds category-specific empty state copy", () => {
    expect(getCategoryEmptyMessage(categories[0])).toContain("laundry");
    expect(getCategoryEmptyMessage(categories[0])).toBe("No providers are offering laundry in this area yet.");
    expect(getCategoryEmptyMessage(null)).toBe("Adjust filters or try a new search.");
  });
});
