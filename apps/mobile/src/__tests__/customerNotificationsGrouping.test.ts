jest.mock("../api/http", () => ({
  ackAllMyNotifications: jest.fn(),
  ackMyNotification: jest.fn(),
  fetchMyNotifications: jest.fn(),
  getMyNotificationPreferences: jest.fn(),
  updateMyNotificationPreferences: jest.fn(),
}));

import {
  getCustomerNotificationCopy,
  getLatestNotificationForAppointment,
  groupCustomerNotifications,
} from "../hooks/useCustomerNotifications";
import type { Notification } from "../types/notification";

function makeNotification(overrides: Partial<Notification>): Notification {
  return {
    id: overrides.id ?? "1",
    company_id: overrides.company_id ?? "company-1",
    appointment_id: overrides.appointment_id ?? "appointment-1",
    kind: overrides.kind ?? "APPOINTMENT_STATUS_CHANGED",
    channel: overrides.channel ?? "in_app",
    target: overrides.target ?? "user-1",
    payload: overrides.payload ?? {},
    status: overrides.status ?? "delivered",
    delivered: overrides.delivered ?? true,
    delivered_at: overrides.delivered_at ?? "2026-04-13T12:00:00Z",
    read_at: overrides.read_at ?? null,
    created_at: overrides.created_at ?? "2026-04-13T12:00:00Z",
  };
}

describe("customer notification grouping", () => {
  it("groups notifications by appointment and keeps the latest as primary", () => {
    const notifications = [
      makeNotification({
        id: "older",
        appointment_id: "appt-1",
        kind: "APPOINTMENT_STATUS_CHANGED",
        payload: { new_status: "cleaning" },
        created_at: "2026-04-13T10:00:00Z",
      }),
      makeNotification({
        id: "latest",
        appointment_id: "appt-1",
        kind: "APPOINTMENT_STATUS_CHANGED",
        payload: { new_status: "ready" },
        created_at: "2026-04-13T11:00:00Z",
      }),
      makeNotification({
        id: "other",
        appointment_id: "appt-2",
        kind: "APPOINTMENT_PROVIDER_ASSIGNED",
        created_at: "2026-04-13T09:00:00Z",
      }),
    ];

    const groups = groupCustomerNotifications(notifications);

    expect(groups).toHaveLength(2);
    expect(groups[0].appointmentId).toBe("appt-1");
    expect(groups[0].latest.id).toBe("latest");
    expect(groups[0].older.map((item) => item.id)).toEqual(["older"]);
  });

  it("returns the latest grouped notification for appointment detail alignment", () => {
    const notifications = [
      makeNotification({
        id: "confirmed",
        appointment_id: "appt-1",
        kind: "APPOINTMENT_CONFIRMED",
        created_at: "2026-04-13T08:00:00Z",
      }),
      makeNotification({
        id: "delivery",
        appointment_id: "appt-1",
        kind: "APPOINTMENT_STATUS_CHANGED",
        payload: { new_status: "out_for_delivery" },
        created_at: "2026-04-13T12:00:00Z",
      }),
    ];

    expect(getLatestNotificationForAppointment(notifications, "appt-1")?.id).toBe("delivery");
  });

  it("uses category-neutral status copy for in-care updates", () => {
    const copy = getCustomerNotificationCopy(
      makeNotification({
        kind: "APPOINTMENT_STATUS_CHANGED",
        payload: { new_status: "cleaning", category_slug: "laundry", category_name: "Laundry" },
      }),
    );

    expect(copy.title).toBe("In care update");
    expect(copy.detail).toBe("Your order is now in care.");
  });
});
