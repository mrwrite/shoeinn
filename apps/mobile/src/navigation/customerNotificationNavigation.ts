import type { Notification } from "../types/notification";
import { navigateWhenReady, navigationRef } from "./rootNavigation";

type DestinationLike = {
  appointment_id?: string | null;
  payload?: Record<string, unknown> | null;
};

type PushDataLike = Record<string, unknown> | null | undefined;

function readStringField(source: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!source) {
    return null;
  }
  const value = source[key];
  return typeof value === "string" ? value : null;
}

export function resolveCustomerAppointmentDestination(
  value: DestinationLike | PushDataLike,
): string | null {
  if (!value) {
    return null;
  }

  if ("payload" in value || "appointment_id" in value) {
    const payload = ("payload" in value ? value.payload : value) as Record<string, unknown> | null | undefined;
    const appointmentId =
      ("appointment_id" in value && typeof value.appointment_id === "string" && value.appointment_id) ||
      readStringField(payload, "destination_appointment_id") ||
      readStringField(payload, "appointment_id");
    return appointmentId || null;
  }

  return readStringField(value, "destination_appointment_id") || readStringField(value, "appointment_id");
}

export function openCustomerAppointmentFromNotification(
  source: Notification | PushDataLike,
) {
  const appointmentId = resolveCustomerAppointmentDestination(source);
  if (!appointmentId) {
    return;
  }

  navigateWhenReady(() => {
    navigationRef.navigate("AppointmentsTab", {
      screen: "AppointmentDetail",
      params: { appointmentId },
    } as never);
  });
}
