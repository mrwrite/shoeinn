// src/api/http.ts
import Constants from "expo-constants";

import type {
  Appointment,
  AppointmentHold,
  ConfirmAppointmentPayload,
  HoldCreatePayload,
  Service,
} from "../types/booking";

export const API_URL: string =
  (Constants.expoConfig?.extra as any)?.API_URL ?? "http://CHANGE_ME:8000";

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const url = `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  console.log(`[HTTP] ${method}`, url);

  try {
    const response = await fetch(url, {
      ...init,
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: ctrl.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function listServices(): Promise<Service[]> {
  return request<Service[]>("GET", "/services");
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

export function confirmAppointment(
  payload: ConfirmAppointmentPayload,
): Promise<Appointment> {
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

export function expireHolds(): Promise<{ expired: number }> {
  return request<{ expired: number }>("POST", "/appointments/holds/expire");
}
