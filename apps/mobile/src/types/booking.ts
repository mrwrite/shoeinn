export interface Service {
  id: string;
  company_id?: string | null;
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
  company_id?: string;
  service_id: string;
  hold_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  start_time: string;
  end_time: string;
  status:
    | "requested"
    | "confirmed"
    | "picked_up"
    | "cleaning"
    | "ready"
    | "delivered"
    | "completed"
    | "cancelled";
  payment_id?: string | null;
  payment_status?: "pending" | "requires_action" | "succeeded" | "failed" | "refunded" | "disputed" | null;
  payment_checkout_url?: string | null;
  payment_amount_expected?: number | null;
  payment_amount_received?: number | null;
  payment_currency?: string | null;
  created_at: string;
}

export interface HoldCreatePayload {
  service_id: string;
  start_time: string;
  company_id?: string;
  type?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface ConfirmAppointmentPayload {
  hold_id: string;
  company_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  idempotencyKey?: string;
  type?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}
