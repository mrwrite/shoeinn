import { QueryClient } from "@tanstack/react-query";

import { handleLiveAppointmentEvent } from "../hooks/liveAppointmentEventHandler";
import { appointmentsTabOptions } from "../navigation/rootTabsOptions";
import {
  appointmentAssignmentQueryKey,
  appointmentEventsQueryKey,
  appointmentQueryKey,
  customerAppointmentsQueryKey,
  customerNotificationsQueryKey,
} from "../query/keys";
import type { Appointment, AppointmentSummary } from "../types/booking";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function makeSummary(overrides: Partial<AppointmentSummary>): AppointmentSummary {
  return {
    id: overrides.id ?? "appt-1",
    company_id: overrides.company_id ?? "company-1",
    service_name: overrides.service_name ?? "Cleaning",
    customer_name: overrides.customer_name ?? "Customer",
    customer_phone: overrides.customer_phone ?? "555-0100",
    start_time: overrides.start_time ?? "2026-06-02T12:00:00Z",
    status: overrides.status ?? "confirmed",
    payment_status: overrides.payment_status ?? "succeeded",
  };
}

function makeAppointment(overrides: Partial<Appointment>): Appointment {
  return {
    ...makeSummary(overrides),
    service_id: overrides.service_id ?? "service-1",
    end_time: overrides.end_time ?? "2026-06-02T13:00:00Z",
    status: overrides.status ?? "confirmed",
    created_at: overrides.created_at ?? "2026-06-02T11:00:00Z",
  };
}

describe("live appointment events", () => {
  it("patches customer appointment list and detail status without dropping the list item", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(customerAppointmentsQueryKey, [
      makeSummary({ id: "appt-1", status: "confirmed" }),
      makeSummary({ id: "appt-2", status: "ready" }),
    ]);
    queryClient.setQueryData(appointmentQueryKey("appt-1"), makeAppointment({ id: "appt-1", status: "confirmed" }));

    handleLiveAppointmentEvent(queryClient, "customer", {
      type: "appointment_status_changed",
      appointment_id: "appt-1",
      event_kind: "status_change",
      status: "en_route_pickup",
      previous_status: "confirmed",
      actor_role: "provider",
    });

    const list = queryClient.getQueryData<AppointmentSummary[]>(customerAppointmentsQueryKey);
    const detail = queryClient.getQueryData<Appointment>(appointmentQueryKey("appt-1"));

    expect(list).toHaveLength(2);
    expect(list?.find((appointment) => appointment.id === "appt-1")?.status).toBe("en_route_pickup");
    expect(list?.find((appointment) => appointment.id === "appt-2")?.status).toBe("ready");
    expect(detail?.status).toBe("en_route_pickup");
    queryClient.clear();
  });

  it("invalidates customer appointment, detail, assignment, events, and notification queries", () => {
    const queryClient = createQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    handleLiveAppointmentEvent(queryClient, "customer", {
      type: "appointment_status_changed",
      appointment_id: "appt-1",
      event_kind: "status_change",
      status: "out_for_delivery",
      previous_status: "ready",
      actor_role: "provider",
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: customerAppointmentsQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: customerNotificationsQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: appointmentQueryKey("appt-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: appointmentAssignmentQueryKey("appt-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: appointmentEventsQueryKey("appt-1") });
    queryClient.clear();
  });

  it("keeps notification count off the Appointments tab options", () => {
    expect(appointmentsTabOptions.title).toBe("Appointments");
    expect("tabBarBadge" in appointmentsTabOptions).toBe(false);
  });
});
