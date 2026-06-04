import React from "react";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

import { ProviderCard } from "./ProviderCard";
import { ServiceCard } from "./ServiceCard";
import { CategoryTile } from "./ui/CategoryTile";
import type { Service } from "../types/booking";
import type { Company } from "../types/company";

const renderer = require("react-test-renderer");
const { act } = renderer;

function renderTextTree(element: React.ReactElement): string {
  let tree: { toJSON: () => unknown } | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return JSON.stringify(tree?.toJSON());
}

function renderComponent(element: React.ReactElement) {
  let tree: any;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

describe("luxury discovery cards", () => {
  it("renders selected category tile copy and accessibility state", () => {
    const output = renderTextTree(
      <CategoryTile label="Laundry" categorySlug="laundry" iconName="shirt-outline" selected onPress={() => undefined} />,
    );

    expect(output).toContain("Laundry");
    expect(output).toContain("Filter by Laundry");
  });

  it("renders provider category metadata without shoe-only fallback copy", () => {
    const company: Company = {
      id: "company-1",
      name: "Shelby Premium Care",
      city: "Helena",
      state: "AL",
      offered_categories: [
        { id: "laundry", slug: "laundry", name: "Laundry", icon_key: "shirt" },
        { id: "dry-cleaning", slug: "dry-cleaning", name: "Dry Cleaning", icon_key: "sparkles" },
      ],
    };

    const output = renderTextTree(<ProviderCard company={company} />);

    expect(output).toContain("Shelby Premium Care");
    expect(output).toContain("Laundry");
    expect(output).toContain("Dry Cleaning");
    expect(output).toContain("Vetted local care team");
    expect(output).not.toContain("shoe provider");
  });

  it("renders service category metadata and price with existing props", () => {
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

    const output = renderTextTree(<ServiceCard service={service} />);

    expect(output).toContain("Designer Handbag Refresh");
    expect(output).toContain("Handbags & Leather");
    expect(output).toContain("$88.00");
    expect(output).toContain("Book service");
  });

  it("preserves service booking callback from the card CTA", () => {
    const service: Service = {
      id: "svc-2",
      company_id: "company-1",
      category_slug: "laundry",
      category_name: "Laundry",
      category_icon_key: "shirt",
      name: "Wash & Fold Essentials",
      slug: "wash-fold-essentials",
      description: "Premium laundry care.",
      duration_minutes: 60,
      price_cents: 3200,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const onBook = jest.fn();
    const tree = renderComponent(<ServiceCard service={service} onBook={onBook} />);
    const bookButton = tree.root.findByProps({ accessibilityLabel: "Book service" });

    act(() => {
      bookButton.props.onPress();
    });

    expect(onBook).toHaveBeenCalledWith(service);
  });
});
