import {
  getDemoLoginAccounts,
  getDemoMarket,
  getDemoMarketDiscoveryLocation,
  getDemoMarketLabel,
  MT_JULIET_DEMO_ACCOUNTS,
  SHELBY_DEMO_ACCOUNTS,
  shouldShowDemoLogins,
} from "../auth/demoLogins";

describe("demo login helpers", () => {
  it("shows demo logins when the flag is enabled", () => {
    expect(shouldShowDemoLogins(true)).toBe(true);
  });

  it("hides demo logins when the flag is disabled", () => {
    expect(shouldShowDemoLogins(false)).toBe(false);
  });

  it("uses Shelby credentials by default", () => {
    expect(getDemoMarket(undefined)).toBe("shelby");
    expect(getDemoMarketLabel("shelby")).toBe("Shelby County");
    expect(getDemoMarketDiscoveryLocation("shelby")).toEqual({
      label: "Shelby County, AL",
      city: null,
      state: "AL",
    });
    expect(getDemoLoginAccounts("shelby")).toEqual([
      {
        label: "Shelby Customer",
        email: "customer@shoeinn.com",
        password: "Password1!",
      },
      {
        label: "Shelby Provider",
        email: "pelham.driver1@shoeinn.com",
        password: "Password1!",
      },
      {
        label: "Shelby Company Admin",
        email: "pelham.admin@shoeinn.com",
        password: "Password1!",
      },
    ]);
    expect(SHELBY_DEMO_ACCOUNTS).toEqual(getDemoLoginAccounts("shelby"));
  });

  it("uses the expected Mt. Juliet credentials when selected", () => {
    expect(getDemoMarket("mt_juliet")).toBe("mt_juliet");
    expect(getDemoMarketLabel("mt_juliet")).toBe("Mt. Juliet");
    expect(getDemoMarketDiscoveryLocation("mt_juliet")).toEqual({
      label: "Mt. Juliet, TN",
      city: "Mt. Juliet",
      state: "TN",
    });
    expect(getDemoLoginAccounts("mt_juliet")).toEqual([
      {
        label: "Mt. Juliet Customer",
        email: "customer.mtjuliet@shoeinn.demo",
        password: "Password123!",
      },
      {
        label: "Mt. Juliet Provider",
        email: "provider.mtjuliet@shoeinn.demo",
        password: "Password123!",
      },
      {
        label: "Mt. Juliet Company Admin",
        email: "admin.mtjuliet@shoeinn.demo",
        password: "Password123!",
      },
    ]);
    expect(MT_JULIET_DEMO_ACCOUNTS).toEqual(getDemoLoginAccounts("mt_juliet"));
  });
});
