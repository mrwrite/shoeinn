import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getLiveEventsWebSocketUrl } from "../api/http";
import { useAuthStore } from "../state/authStore";

type LiveEvent =
  | {
      type: "assignment_changed";
      appointment_id: string;
      event_kind: string;
      company_id?: string | null;
      assignment_action?: string;
    }
  | {
      type: "appointment_status_changed";
      appointment_id: string;
      event_kind: string;
      company_id?: string | null;
      status?: string;
      previous_status?: string | null;
    };

const LIVE_ENABLED_ROLES = new Set(["customer", "company", "provider", "company_admin"]);
const RECONNECT_DELAY_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 25000;

export function useLiveAppointmentEvents() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldReconnectRef = useRef(false);

  useEffect(() => {
    const isEnabled = !!token && !!role && LIVE_ENABLED_ROLES.has(role);
    shouldReconnectRef.current = isEnabled;

    const clearTimers = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };

    const closeSocket = () => {
      clearTimers();
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };

    const invalidateForEvent = (event: LiveEvent) => {
      const appointmentId = event.appointment_id;
      if (!appointmentId) {
        return;
      }

      if (role === "customer") {
        void queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
        void queryClient.invalidateQueries({ queryKey: ["me", "notifications"] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
        void queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      }

      void queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
      void queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId, "assignment"] });
      void queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId, "events"] });
    };

    const connect = () => {
      if (!isEnabled || socketRef.current) {
        return;
      }

      const url = getLiveEventsWebSocketUrl(token);
      if (!url) {
        return;
      }

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        heartbeatTimerRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as LiveEvent;
          invalidateForEvent(event);
        } catch (error) {
          console.warn("[LiveEvents] Failed to parse event", error);
        }
      };

      socket.onerror = () => {
        closeSocket();
      };

      socket.onclose = () => {
        closeSocket();
        if (!shouldReconnectRef.current) {
          return;
        }
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, RECONNECT_DELAY_MS);
      };
    };

    if (isEnabled) {
      connect();
    } else {
      closeSocket();
    }

    return () => {
      shouldReconnectRef.current = false;
      closeSocket();
    };
  }, [queryClient, role, token]);
}

export default useLiveAppointmentEvents;
