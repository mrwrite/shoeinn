import { fallbackMarketplaceVisual, getMarketplaceVisual, getPrimaryCategorySlug } from "./marketplaceVisuals";

describe("marketplace visuals", () => {
  it("returns luxury category visual tokens for known categories", () => {
    expect(getMarketplaceVisual("shoes")).toMatchObject({
      iconName: "footsteps-outline",
      backgroundColor: "#0B5563",
      accentColor: "#D6A73D",
      softColor: "#EAF3F2",
    });
    expect(getMarketplaceVisual("laundry").backgroundColor).toBe("#117B7C");
  });

  it("falls back to brand visual treatment for unknown or absent categories", () => {
    expect(getMarketplaceVisual("unknown-category")).toEqual(fallbackMarketplaceVisual);
    expect(getMarketplaceVisual(null)).toEqual(fallbackMarketplaceVisual);
  });

  it("selects the first offered category slug for provider media treatment", () => {
    expect(
      getPrimaryCategorySlug([
        { id: "laundry", slug: "laundry", name: "Laundry", icon_key: "shirt" },
        { id: "shoes", slug: "shoes", name: "Shoes", icon_key: "shoe" },
      ]),
    ).toBe("laundry");
    expect(getPrimaryCategorySlug([])).toBeNull();
  });
});
