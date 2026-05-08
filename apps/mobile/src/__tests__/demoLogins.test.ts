import { MT_JULIET_DEMO_ACCOUNTS, shouldShowDemoLogins } from "../auth/demoLogins";

describe("demo login helpers", () => {
  it("shows demo logins when the flag is enabled", () => {
    expect(shouldShowDemoLogins(true)).toBe(true);
  });

  it("hides demo logins when the flag is disabled", () => {
    expect(shouldShowDemoLogins(false)).toBe(false);
  });

  it("uses the expected Mt. Juliet credentials", () => {
    expect(MT_JULIET_DEMO_ACCOUNTS).toEqual([
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
  });
});
