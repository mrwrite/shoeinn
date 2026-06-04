import React from "react";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

import { AppointmentCard } from "./AppointmentCard";
import { AppointmentTimeline } from "./ui/AppointmentTimeline";
import type { AppointmentSummary } from "../types/booking";

const renderer = require("react-test-renderer");
const { act } = renderer;

function renderTextTree(element: React.ReactElement): string {
  let tree: { toJSON: () => unknown } | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return JSON.stringify(tree?.toJSON());
}

describe("luxury appointment surfaces", () => {
  it("renders appointment category metadata and neutral in-care status copy", () => {
    const appointment: AppointmentSummary = {
      id: "appt-1",
      customer_name: "Customer",
      customer_phone: "1234567890",
      company_id: "company-1",
      service_id: "service-1",
      service_name: "Wash & Fold Essentials",
      category_id: "cat-laundry",
      category_slug: "laundry",
      category_name: "Laundry",
      category_icon_key: "shirt",
      start_time: "2026-06-04T14:00:00Z",
      status: "cleaning",
      payment_status: "succeeded",
      payment_mode: "service",
      city: "Helena",
      state: "AL",
    };

    const output = renderTextTree(<AppointmentCard appointment={appointment} />);

    expect(output).toContain("Wash & Fold Essentials");
    expect(output).toContain("Laundry");
    expect(output).toContain("In care");
    expect(output).toContain("Paid");
    expect(output).not.toContain("Cleaning");
  });

  it("renders timeline detail with in-care label", () => {
    const output = renderTextTree(
      <AppointmentTimeline
        items={[
          { key: "picked_up", title: "Picked up", detail: "Finished", state: "completed" },
          { key: "cleaning", title: "In care", detail: "Happening now", state: "current" },
          { key: "ready", title: "Ready for return", detail: "Coming up next", state: "upcoming" },
        ]}
      />,
    );

    expect(output).toContain("In care");
    expect(output).toContain("Happening now");
    expect(output).not.toContain("Cleaning");
  });
});
