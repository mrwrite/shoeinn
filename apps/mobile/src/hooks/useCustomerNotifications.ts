import { useQuery } from "@tanstack/react-query";

import {
  ackAllMyNotifications,
  ackMyNotification,
  fetchMyNotifications,
  getMyNotificationPreferences,
  updateMyNotificationPreferences,
} from "../api/http";
import type { Notification } from "../types/notification";
import type { NotificationPreferences } from "../types/user";

export const customerNotificationsQueryKey = ["me", "notifications"] as const;
export const customerNotificationPreferencesQueryKey = ["me", "notification-preferences"] as const;

const statusLabels: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  en_route_pickup: "En route to pickup",
  picked_up: "Picked up",
  cleaning: "Cleaning",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type CustomerNotificationViewModel = {
  title: string;
  detail: string;
  timestampLabel: string;
  unread: boolean;
};

export type GroupedCustomerNotification = {
  key: string;
  appointmentId: string | null;
  latest: Notification;
  older: Notification[];
  unread: boolean;
  isStandalone: boolean;
};

export type CustomerNotificationGroupAckInput = {
  notificationIds: string[];
};

function formatStatusLabel(status?: string | null): string | null {
  if (!status) {
    return null;
  }
  return statusLabels[status] ?? status.replace(/_/g, " ");
}

function formatRelativeTime(value: string): string {
  const then = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return new Date(value).toLocaleString();
}

export function getCustomerNotificationCopy(notification: Notification): CustomerNotificationViewModel {
  const payload = notification.payload ?? {};
  const newProviderName = typeof payload.new_provider_name === "string" ? payload.new_provider_name : null;
  const oldProviderName = typeof payload.old_provider_name === "string" ? payload.old_provider_name : null;
  const newStatus = formatStatusLabel(typeof payload.new_status === "string" ? payload.new_status : null);

  if (notification.kind === "APPOINTMENT_PROVIDER_ASSIGNED") {
    return {
      title: newProviderName ? `${newProviderName} is assigned` : "Provider assigned",
      detail: "Your order now has a provider and progress updates will appear here.",
      timestampLabel: formatRelativeTime(notification.created_at),
      unread: !notification.read_at,
    };
  }

  if (notification.kind === "APPOINTMENT_PROVIDER_REASSIGNED") {
    return {
      title: newProviderName ? `Provider changed to ${newProviderName}` : "Provider updated",
      detail: oldProviderName
        ? `Your order was reassigned from ${oldProviderName} to ${newProviderName ?? "a new provider"}.`
        : "Your provider changed and the latest appointment details are now available.",
      timestampLabel: formatRelativeTime(notification.created_at),
      unread: !notification.read_at,
    };
  }

  if (notification.kind === "APPOINTMENT_STATUS_CHANGED") {
    return {
      title: newStatus ? `${newStatus} update` : "Appointment update",
      detail: newStatus
        ? `Your order is now ${newStatus.toLowerCase()}.`
        : "There is a new progress update for your appointment.",
      timestampLabel: formatRelativeTime(notification.created_at),
      unread: !notification.read_at,
    };
  }

  if (notification.kind === "APPOINTMENT_CONFIRMED") {
    return {
      title: "Appointment confirmed",
      detail: "Your booking is confirmed and will continue to update here.",
      timestampLabel: formatRelativeTime(notification.created_at),
      unread: !notification.read_at,
    };
  }

  return {
    title: "Appointment update",
    detail: "There is a new update for your appointment.",
    timestampLabel: formatRelativeTime(notification.created_at),
    unread: !notification.read_at,
  };
}

export function useCustomerNotifications(enabled = true) {
  return useQuery({
    queryKey: customerNotificationsQueryKey,
    queryFn: fetchMyNotifications,
    enabled,
  });
}

export function useCustomerNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: customerNotificationPreferencesQueryKey,
    queryFn: getMyNotificationPreferences,
    enabled,
  });
}

export function getUnreadCustomerNotificationCount(notifications: Notification[] | undefined): number {
  return (notifications ?? []).filter((notification) => !notification.read_at).length;
}

export function getNotificationPriority(notification: Notification): number {
  const payload = notification.payload ?? {};
  const newStatus = typeof payload.new_status === "string" ? payload.new_status : null;

  if (notification.kind === "APPOINTMENT_PROVIDER_REASSIGNED") {
    return 100;
  }
  if (notification.kind === "APPOINTMENT_PROVIDER_ASSIGNED") {
    return 95;
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED" && newStatus === "delivered") {
    return 90;
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED" && newStatus === "out_for_delivery") {
    return 85;
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED" && newStatus === "ready") {
    return 80;
  }
  if (notification.kind === "APPOINTMENT_CONFIRMED") {
    return 70;
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED") {
    return 40;
  }
  return 30;
}

function sortNotificationsNewestFirst(notifications: Notification[]): Notification[] {
  return [...notifications].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export function groupCustomerNotifications(
  notifications: Notification[] | undefined,
): GroupedCustomerNotification[] {
  const items = notifications ?? [];
  const byAppointment = new Map<string, Notification[]>();
  const standalone: GroupedCustomerNotification[] = [];

  for (const notification of sortNotificationsNewestFirst(items)) {
    if (!notification.appointment_id) {
      standalone.push({
        key: `standalone:${notification.id}`,
        appointmentId: null,
        latest: notification,
        older: [],
        unread: !notification.read_at,
        isStandalone: true,
      });
      continue;
    }

    const current = byAppointment.get(notification.appointment_id) ?? [];
    current.push(notification);
    byAppointment.set(notification.appointment_id, current);
  }

  const grouped = Array.from(byAppointment.entries()).map(([appointmentId, appointmentNotifications]) => {
    const sorted = sortNotificationsNewestFirst(appointmentNotifications);
    const [latest, ...older] = sorted;
    return {
      key: `appointment:${appointmentId}`,
      appointmentId,
      latest,
      older,
      unread: sorted.some((notification) => !notification.read_at),
      isStandalone: false,
    };
  });

  return [...grouped, ...standalone].sort(
    (left, right) =>
      new Date(right.latest.created_at).getTime() - new Date(left.latest.created_at).getTime(),
  );
}

export function getLatestNotificationForAppointment(
  notifications: Notification[] | undefined,
  appointmentId: string,
): Notification | null {
  const group = groupCustomerNotifications(notifications).find(
    (item) => item.appointmentId === appointmentId,
  );
  return group?.latest ?? null;
}

export function getUnreadNotificationIdsForGroup(
  group: GroupedCustomerNotification,
): string[] {
  return [group.latest, ...group.older]
    .filter((notification) => !notification.read_at)
    .map((notification) => notification.id);
}

export async function ackCustomerNotificationGroup(
  input: CustomerNotificationGroupAckInput,
): Promise<number> {
  if (input.notificationIds.length === 0) {
    return 0;
  }

  await Promise.all(input.notificationIds.map((notificationId) => ackMyNotification(notificationId)));
  return input.notificationIds.length;
}

export { ackMyNotification };
export { ackAllMyNotifications };
export { updateMyNotificationPreferences };
export type { NotificationPreferences };
