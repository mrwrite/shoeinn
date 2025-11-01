// src/api/http.ts
import Constants from "expo-constants";

export const API_URL: string =
  // set in app.config.* or env; fallback to something obvious
  (Constants.expoConfig?.extra as any)?.API_URL ?? "http://CHANGE_ME:8000";

export async function getJson<T = unknown>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const url = `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  console.log("[HTTP] GET", url);

  try {
    const res = await fetch(url, { ...init, method: "GET", signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
