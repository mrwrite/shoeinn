export const servicesQueryKey = ["services"] as const;
export const customerAppointmentsQueryKey = ["appointments", "mine"] as const;
export const customerNotificationsQueryKey = ["me", "notifications"] as const;

export const appointmentQueryKey = (appointmentId: string) => ["appointment", appointmentId] as const;
export const appointmentEventsQueryKey = (appointmentId: string) => ["appointment", appointmentId, "events"] as const;
export const appointmentAssignmentQueryKey = (appointmentId: string) =>
  ["appointment", appointmentId, "assignment"] as const;
