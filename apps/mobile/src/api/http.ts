// src/api/http.ts
import Constants from "expo-constants";

import type {
  Appointment,
  AppointmentAssignment,
  AppointmentEvent,
  AppointmentLocationUpdate,
  AppointmentSummary,
  AppointmentHold,
  ConfirmAppointmentPayload,
  HoldCreatePayload,
  Service,
} from "../types/booking";
import type { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from "../types/auth";
import type { Company } from "../types/company";
import type { ProviderAppointment, StatusUpdatePayload } from "../types/company";
import { getAuthToken } from "../state/authStore";
import type { Notification } from "../types/notification";
import type { PushRegisterRequest, PushUnregisterRequest } from "../types/push";

export const API_URL: string =
  (Constants.expoConfig?.extra as any)?.API_URL ??
  // eslint-disable-next-line no-process-env
  (process.env.EXPO_PUBLIC_API_URL as string) ??
  "http://CHANGE_ME:8000";

type HttpMethod = "GET" | "POST";

interface RequestOptions extends RequestInit {
  auth?: boolean;
  timeoutMs?: number;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  { auth = false, timeoutMs = 10000, ...init }: RequestOptions = {},
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const url = `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = auth ? getAuthToken() : null;
  console.log(`[HTTP] ${method}`, url);

  try {
    const response = await fetch(url, {
      ...init,
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
      signal: ctrl.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let detail = text;
      try {
        const parsed = JSON.parse(text);
        detail = parsed?.detail ?? text;
      } catch (err) {
        // fall through to throw below
      }
      throw new Error(`HTTP ${response.status}: ${detail.slice(0, 200)}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>("POST", "/auth/login", payload);
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return request<RegisterResponse>("POST", "/auth/register", payload);
}

export function listServices(companyId?: string): Promise<Service[]> {
  const search = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
  return request<Service[]>("GET", `/services${search}`);
}

export function listCompanies(): Promise<Company[]> {
  return request<Company[]>("GET", "/companies");
}

export function getJson<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function getAvailability(serviceId: string, date: string): Promise<string[]> {
  const params = new URLSearchParams({ service_id: serviceId, date });
  return request<string[]>("GET", `/availability?${params.toString()}`);
}

export function createHold(payload: HoldCreatePayload): Promise<AppointmentHold> {
  console.log("[Booking] Creating hold", payload);
  return request<AppointmentHold>("POST", "/appointments/holds", payload);
}

export function confirmAppointment(payload: ConfirmAppointmentPayload): Promise<Appointment> {
  const { idempotencyKey, ...rest } = payload;
  console.log("[Booking] Confirming appointment", rest.hold_id);
  return request<Appointment>("POST", "/appointments/confirm", rest, {
    headers: idempotencyKey
      ? {
          "Idempotency-Key": idempotencyKey,
        }
      : undefined,
  });
}

export function getAppointment(id: string): Promise<Appointment> {
  return request<Appointment>("GET", `/appointments/${id}`);
}

export function getMyAppointments(): Promise<AppointmentSummary[]> {
  return request<AppointmentSummary[]>("GET", "/appointments/mine", undefined, { auth: true });
}

export function getAppointmentEvents(id: string): Promise<AppointmentEvent[]> {
  return request<AppointmentEvent[]>("GET", `/appointments/${id}/events`, undefined, { auth: true });
}

export function getAppointmentLatestLocation(id: string): Promise<AppointmentLocationUpdate> {
  return request<AppointmentLocationUpdate>("GET", `/appointments/${id}/location/latest`, undefined, { auth: true });
}

export function getAppointmentAssignment(id: string): Promise<AppointmentAssignment> {
  return request<AppointmentAssignment>("GET", `/appointments/${id}/assignment`, undefined, { auth: true });
}

export function expireHolds(): Promise<{ expired: number }> {
  return request<{ expired: number }>("POST", "/appointments/holds/expire");
}

export function fetchOpenAppointments(): Promise<ProviderAppointment[]> {
  return request<ProviderAppointment[]>("GET", "/company/appointments/open", undefined, { auth: true });
}

export function updateAppointmentStatus(
  id: string,
  payload: StatusUpdatePayload,
): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>("POST", `/company/appointments/${id}/status`, payload, {
    auth: true,
  });
}

export function fetchNotifications(): Promise<Notification[]> {
  return request<Notification[]>("GET", "/company/notifications", undefined, { auth: true });
}

export function ackNotification(id: string): Promise<Notification> {
  return request<Notification>("POST", `/company/notifications/${id}/ack`, undefined, { auth: true });
}

export function registerPushToken(payload: PushRegisterRequest): Promise<void> {
  return request<void>("POST", "/push/register", payload, { auth: true });
}

export function unregisterPushToken(payload: PushUnregisterRequest): Promise<void> {
  return request<void>("POST", "/push/unregister", payload, { auth: true });
}
