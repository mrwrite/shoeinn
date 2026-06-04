import React from "react";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

import { OwnerJobCard } from "./OwnerJobCard";
import {
  buildProviderTimeline,
  formatOperationalCue,
  getClaimFeedback,
  getEmphasis,
  getFilteredAppointments,
  getNextActionLabel,
} from "../features/providerAdminCopy";
import type { ProviderAppointment } from "../types/company";
import type { AppointmentTimelineItem } from "./ui/AppointmentTimeline";

const renderer = require("react-test-renderer");
const { act } = renderer;

function renderTextTree(element: React.ReactElement): string {
  let tree: { toJSON: () => unknown } | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return JSON.stringify(tree?.toJSON());
}

describe("provider and admin luxury presentation", () => {
  const appointment: ProviderAppointment = {
    id: "appt-1",
    customer_name: "Taylor",
    customer_phone: "1234567890",
    customer_city: "Helena",
    customer_state: "AL",
    address_line1: "123 Main St",
    city: "Helena",
    state: "AL",
    service_id: "svc-1",
    service_name: "Designer Handbag Refresh",
    category_id: "cat-handbags",
    category_slug: "handbags-leather",
    category_name: "Handbags & Leather",
    category_icon_key: "briefcase",
    start_time: "2026-06-04T14:00:00Z",
    status: "confirmed",
    provider_name: undefined,
  };

  it("renders the owner job card with category metadata and operational context", () => {
    const output = renderTextTree(
      <OwnerJobCard appointment={appointment} emphasis="priority" nextActionLabel="Needs assignment" onPress={() => undefined} />,
    );

    expect(output).toContain("Designer Handbag Refresh");
    expect(output).toContain("Taylor");
    expect(output).toContain("Handbags & Leather");
    expect(output).toContain("Needs assignment");
    expect(output).toContain("Unassigned");
    expect(output).toContain("Helena");
  });

  it("keeps provider status and assignment helper copy category-neutral", () => {
    expect(getClaimFeedback(new Error("409 Conflict"))).toEqual({
      tone: "warning",
      message: "This job is no longer available. Refresh to see the latest list.",
    });
    expect(formatOperationalCue([], "available")).toBe("No claimable jobs are waiting right now.");
    expect(formatOperationalCue([appointment], "my")).toContain("currently confirmed");
    expect(getFilteredAppointments([appointment], "unassigned")).toHaveLength(1);
    expect(getFilteredAppointments([{ ...appointment, provider_name: "Ava" }, { ...appointment, id: "appt-2", status: "ready" }], "unassigned")).toHaveLength(0);
    expect(getNextActionLabel({ ...appointment, provider_name: undefined, status: "confirmed" })).toBe("Needs assignment");
    expect(getNextActionLabel({ ...appointment, provider_name: "Ava", status: "ready" })).toBe("Ready to deliver");
    expect(getEmphasis({ ...appointment, provider_name: undefined, status: "confirmed" })).toBe("priority");
    expect(getEmphasis({ ...appointment, provider_name: "Ava", status: "ready" })).toBe("ready");
  });

  it("keeps provider timeline labels and states readable", () => {
    const timeline = buildProviderTimeline("cleaning");
    const titles = timeline.map((item: AppointmentTimelineItem) => item.title);

    expect(titles).toContain("In care");
    expect(titles).not.toContain("Cleaning");
    expect(timeline.find((item: AppointmentTimelineItem) => item.key === "cleaning")?.state).toBe("current");
  });
});
