import { appointmentsTabOptions } from "./rootTabsOptions";

describe("root tab options", () => {
  it("keeps appointment tab badge separate from notification counts", () => {
    expect(appointmentsTabOptions.title).toBe("Appointments");
    expect("tabBarBadge" in appointmentsTabOptions).toBe(false);
  });
});
