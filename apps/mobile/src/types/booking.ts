export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentHold {
  id: string;
  service_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  start_time: string;
  end_time: string;
  ttl_expires_at: string;
  status: "PENDING" | "EXPIRED" | "CONFIRMED";
}

export interface Appointment {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface HoldCreatePayload {
  service_id: string;
  start_time: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface ConfirmAppointmentPayload {
  hold_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  idempotencyKey?: string;
}
