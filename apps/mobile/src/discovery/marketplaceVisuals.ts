import type { CareCategorySummary } from "../types/care";

export type MarketplaceVisual = {
  iconName: string;
  backgroundColor: string;
  accentColor: string;
  foregroundColor: string;
  softColor: string;
};

const visualsBySlug: Record<string, MarketplaceVisual> = {
  shoes: {
    iconName: "footsteps-outline",
    backgroundColor: "#0B5563",
    accentColor: "#D6A73D",
    foregroundColor: "#FFFFFF",
    softColor: "#EAF3F2",
  },
  laundry: {
    iconName: "shirt-outline",
    backgroundColor: "#117B7C",
    accentColor: "#D6A73D",
    foregroundColor: "#FFFFFF",
    softColor: "#E7F3F1",
  },
  "dry-cleaning": {
    iconName: "sparkles-outline",
    backgroundColor: "#244E5C",
    accentColor: "#D6A73D",
    foregroundColor: "#FFFFFF",
    softColor: "#EDF4F5",
  },
  "handbags-leather": {
    iconName: "bag-handle-outline",
    backgroundColor: "#7B4936",
    accentColor: "#D6A73D",
    foregroundColor: "#FFFFFF",
    softColor: "#F6EEE8",
  },
  "rugs-textiles": {
    iconName: "grid-outline",
    backgroundColor: "#516B58",
    accentColor: "#D6A73D",
    foregroundColor: "#FFFFFF",
    softColor: "#EEF4EE",
  },
  alterations: {
    iconName: "cut-outline",
    backgroundColor: "#5F536B",
    accentColor: "#D6A73D",
    foregroundColor: "#FFFFFF",
    softColor: "#F1EEF5",
  },
};

export const fallbackMarketplaceVisual: MarketplaceVisual = {
  iconName: "sparkles-outline",
  backgroundColor: "#1B1E24",
  accentColor: "#D6A73D",
  foregroundColor: "#FFFFFF",
  softColor: "#F8F5EF",
};

export function getMarketplaceVisual(categorySlug?: string | null): MarketplaceVisual {
  return categorySlug ? visualsBySlug[categorySlug] ?? fallbackMarketplaceVisual : fallbackMarketplaceVisual;
}

export function getPrimaryCategorySlug(categories?: CareCategorySummary[] | null): string | null {
  return categories?.[0]?.slug ?? null;
}
