jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoGoConfig: undefined,
    expoConfig: undefined,
  },
}));

const http = require("./http") as typeof import("./http");

describe("mobile API discovery paths", () => {
  it("builds unfiltered service discovery path", () => {
    expect(http.buildServicesPath()).toBe("/services");
  });

  it("preserves legacy company service discovery path", () => {
    expect(http.buildServicesPath("company-1")).toBe("/services?company_id=company-1");
  });

  it("builds category-aware service discovery path", () => {
    expect(http.buildServicesPath({ companyId: "company-1", categorySlug: "dry-cleaning" })).toBe(
      "/services?company_id=company-1&category_slug=dry-cleaning",
    );
  });

  it("builds unfiltered company discovery path", () => {
    expect(http.buildCompaniesPath()).toBe("/companies");
  });

  it("builds category-aware company discovery path", () => {
    expect(
      http.buildCompaniesPath({
        city: "Mt. Juliet",
        state: "TN",
        query: "care",
        categorySlug: "handbags-leather",
      }),
    ).toBe("/companies?query=care&city=Mt.+Juliet&state=TN&category_slug=handbags-leather");
  });
});
