import { buildQuoteDisplayRows } from "../features/bookingCheckout";

describe("buildQuoteDisplayRows", () => {
  it("includes all payment summary fields from the backend quote", () => {
    const rows = buildQuoteDisplayRows({
      service_id: "svc_123",
      service_name: "Deluxe Clean",
      currency: "usd",
      subtotal: 6500,
      fees: 1098,
      estimated_tax: 627,
      total: 8225,
      line_items: [
        { code: "service_base", label: "Deluxe Clean", amount: 6500, kind: "service" },
        { code: "pickup_delivery_fee", label: "Pickup & delivery fee", amount: 799, kind: "fee" },
        { code: "platform_fee", label: "Service fee", amount: 299, kind: "fee" },
      ],
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Deluxe Clean",
      "Pickup & delivery fee",
      "Service fee",
      "Estimated tax",
      "Total",
    ]);
  });
});
