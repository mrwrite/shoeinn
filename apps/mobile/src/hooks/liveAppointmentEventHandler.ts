import type { QueryClient } from "@tanstack/react-query";

import {
  appointmentAssignmentQueryKey,
  appointmentEventsQueryKey,
  appointmentQueryKey,
  customerAppointmentsQueryKey,
  customerNotificationsQueryKey,
} from "../query/keys";
import type { Appointment, AppointmentSummary, AppointmentStatus } from "../types/booking";

export type LiveEvent =
  | {
      type: "assignment_changed";
      appointment_id: string;
      event_kind: string;
      company_id?: string | null;
      assignment_action?: string;
    }
  | {
      type: "appointment_status_changed";
      appointment_id: string;
      event_kind: string;
      company_id?: string | null;
      status?: string;
      previous_status?: string | null;
      actor_role?: string | null;
    };

const APPOINTMENT_STATUSES = new Set<string>([
  "requested",
  "pending_payment",
  "payment_failed",
  "confirmed",
  "en_route_pickup",
  "picked_up",
  "cleaning",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
]);

function isAppointmentStatus(value: string | undefined): value is AppointmentStatus {
  return Boolean(value && APPOINTMENT_STATUSES.has(value));
}

function patchCustomerAppointmentStatus(
  queryClient: QueryClient,
  appointmentId: string,
  status: AppointmentStatus | undefined,
) {
  if (!status) {
    return;
  }

  queryClient.setQueryData<AppointmentSummary[] | undefined>(
    customerAppointmentsQueryKey,
    (current) =>
      current?.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status } : appointment,
      ),
  );
  queryClient.setQueryData<Appointment | undefined>(
    appointmentQueryKey(appointmentId),
    (current) => (current ? { ...current, status } : current),
  );
}

export function handleLiveAppointmentEvent(
  queryClient: QueryClient,
  role: string | null | undefined,
  event: LiveEvent,
) {
  const appointmentId = event.appointment_id;
  if (!appointmentId) {
    return;
  }

  if (role === "customer") {
    if (event.type === "appointment_status_changed" && isAppointmentStatus(event.status)) {
      patchCustomerAppointmentStatus(queryClient, appointmentId, event.status);
    }
    void queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
    void queryClient.invalidateQueries({ queryKey: customerNotificationsQueryKey });
  } else {
    void queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
    void queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
  }

  void queryClient.invalidateQueries({ queryKey: appointmentQueryKey(appointmentId) });
  void queryClient.invalidateQueries({ queryKey: appointmentAssignmentQueryKey(appointmentId) });
  void queryClient.invalidateQueries({ queryKey: appointmentEventsQueryKey(appointmentId) });
}
