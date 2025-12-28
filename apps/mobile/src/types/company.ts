export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "picked_up"
  | "cleaning"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled";

export interface ProviderAppointment {
  id: string;
  customer_city?: string | null;
  customer_state?: string | null;
  service_name?: string | null;
  start_time: string;
  status: AppointmentStatus;
}

export interface StatusUpdatePayload {
  status: AppointmentStatus;
  confirmed_time?: string | null;
}

export interface Company {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
}
