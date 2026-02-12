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
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  start_time: string;
  end_time: string;
  ttl_expires_at: string;
  status: "PENDING" | "EXPIRED" | "CONFIRMED";
}

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "en_route_pickup"
  | "picked_up"
  | "cleaning"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export interface Appointment {
  id: string;
  company_id?: string | null;
  service_id: string;
  hold_id?: string | null;
  type?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  start_time: string;
  confirmed_time?: string | null;
  end_time: string;
  status: AppointmentStatus;
  payment_id?: string | null;
  payment_status?: "pending" | "requires_action" | "succeeded" | "failed" | "refunded" | "disputed" | null;
  payment_checkout_url?: string | null;
  payment_amount_expected?: number | null;
  payment_amount_received?: number | null;
  payment_currency?: string | null;
  created_at: string;
  updated_at?: string;
  service_name?: string | null;
}

export interface AppointmentSummary {
  customer_name: string;
  customer_phone: string;
  address_line1: any;
  address_line2: any;
  city: any;
  state: any;
  postal_code: any;
  id: string;
  company_id?: string | null;
  service_name?: string | null;
  start_time: string;
  status: AppointmentStatus;
}

export interface AppointmentEvent {
  id: string;
  appointment_id: string;
  kind: string;
  payload?: Record<string, any> | null;
  created_at: string;
}

export interface AppointmentAssignment {
  id: string;
  appointment_id: string;
  user_id: string;
  provider_name?: string | null;
  assigned_at: string;
  unassigned_at?: string | null;
  is_active: boolean;
}

export interface AppointmentLocationUpdate {
  appointment_id: string;
  user_id: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  recorded_at: string;
}

export interface AppointmentProviderLocationResponse {
  location: {
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
    recorded_at: string;
  } | null;
}

export interface AppointmentLocationUpdatePayload {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
}

export interface AppointmentTracking {
  appointment_id: string;
  status: AppointmentStatus;
  is_travel_state: boolean;
  latest_location: AppointmentLocationUpdate | null;
  recent_locations: AppointmentLocationUpdate[];
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
