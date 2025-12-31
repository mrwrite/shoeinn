import type { AppointmentStatus } from "./booking";

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
