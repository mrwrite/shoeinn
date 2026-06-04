import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
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
import { customerNotificationsQueryKey } from "../query/keys";
import { getReadableAppointmentStatus } from "../features/appointmentCopy";

export { customerNotificationsQueryKey };
export const customerNotificationPreferencesQueryKey = ["me", "notification-preferences"] as const;

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

export type CustomerNotificationPriorityTone = "high" | "normal";

export type CustomerNotificationPriorityPresentation = {
  tone: CustomerNotificationPriorityTone;
  label: string;
};

export type ArchivedCustomerNotificationGroupRecord = {
  latestNotificationId: string;
  archivedAt: string;
};

export type ArchivedCustomerNotificationGroupState = Record<
  string,
  ArchivedCustomerNotificationGroupRecord
>;

const CUSTOMER_NOTIFICATION_ARCHIVE_STORAGE_KEY = "customer-notification-archive-v1";
const DEFAULT_RETENTION_DAYS = 30;
const HIGH_PRIORITY_RETENTION_DAYS = 60;

function formatStatusLabel(status?: string | null): string | null {
  if (!status) {
    return null;
  }
  return getReadableAppointmentStatus(status);
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

export function getNotificationPriorityPresentation(
  notification: Notification,
): CustomerNotificationPriorityPresentation {
  const payload = notification.payload ?? {};
  const newStatus = typeof payload.new_status === "string" ? payload.new_status : null;

  if (notification.kind === "APPOINTMENT_PROVIDER_REASSIGNED") {
    return { tone: "high", label: "Assignment change" };
  }
  if (notification.kind === "APPOINTMENT_PROVIDER_ASSIGNED") {
    return { tone: "high", label: "Provider assigned" };
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED" && newStatus === "ready") {
    return { tone: "high", label: "Ready for delivery" };
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED" && newStatus === "out_for_delivery") {
    return { tone: "high", label: "Delivery in progress" };
  }
  if (notification.kind === "APPOINTMENT_STATUS_CHANGED" && newStatus === "delivered") {
    return { tone: "high", label: "Delivered" };
  }

  return { tone: "normal", label: notification.appointment_id ? "Appointment update" : "Update" };
}

function getAgeInDays(value: string): number {
  const ageMs = Date.now() - new Date(value).getTime();
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
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

export function isNotificationGroupRetentionEligible(
  group: GroupedCustomerNotification,
): boolean {
  if (group.unread) {
    return false;
  }

  const priority = getNotificationPriorityPresentation(group.latest);
  const ageInDays = getAgeInDays(group.latest.created_at);
  const retentionDays =
    priority.tone === "high" ? HIGH_PRIORITY_RETENTION_DAYS : DEFAULT_RETENTION_DAYS;
  return ageInDays >= retentionDays;
}

export function shouldRestoreArchivedGroup(
  group: GroupedCustomerNotification,
  archiveRecord: ArchivedCustomerNotificationGroupRecord | undefined,
): boolean {
  if (!archiveRecord) {
    return false;
  }

  return group.unread && group.latest.id !== archiveRecord.latestNotificationId;
}

export function shouldHideNotificationGroup(
  group: GroupedCustomerNotification,
  archivedGroups: ArchivedCustomerNotificationGroupState,
): boolean {
  const archiveRecord = archivedGroups[group.key];
  if (archiveRecord && !shouldRestoreArchivedGroup(group, archiveRecord)) {
    return true;
  }

  return isNotificationGroupRetentionEligible(group);
}

export function useArchivedCustomerNotificationGroups(
  groups: GroupedCustomerNotification[],
) {
  const [archivedGroups, setArchivedGroups] =
    useState<ArchivedCustomerNotificationGroupState>({});
  const [isArchiveStateLoaded, setIsArchiveStateLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadArchivedGroups() {
      try {
        const raw = await AsyncStorage.getItem(CUSTOMER_NOTIFICATION_ARCHIVE_STORAGE_KEY);
        if (!active) {
          return;
        }
        if (!raw) {
          setArchivedGroups({});
          return;
        }

        const parsed = JSON.parse(raw) as ArchivedCustomerNotificationGroupState;
        setArchivedGroups(parsed ?? {});
      } catch (error) {
        if (active) {
          setArchivedGroups({});
        }
      } finally {
        if (active) {
          setIsArchiveStateLoaded(true);
        }
      }
    }

    void loadArchivedGroups();
    return () => {
      active = false;
    };
  }, []);

  const normalizedArchivedGroups = useMemo(() => {
    let changed = false;
    const nextEntries = Object.entries(archivedGroups).filter(([groupKey, archiveRecord]) => {
      const group = groups.find((candidate) => candidate.key === groupKey);
      if (!group) {
        return true;
      }
      const shouldKeep = !shouldRestoreArchivedGroup(group, archiveRecord);
      if (!shouldKeep) {
        changed = true;
      }
      return shouldKeep;
    });

    if (!changed) {
      return archivedGroups;
    }

    return Object.fromEntries(nextEntries);
  }, [archivedGroups, groups]);

  useEffect(() => {
    if (!isArchiveStateLoaded) {
      return;
    }

    if (normalizedArchivedGroups !== archivedGroups) {
      setArchivedGroups(normalizedArchivedGroups);
      return;
    }

    void AsyncStorage.setItem(
      CUSTOMER_NOTIFICATION_ARCHIVE_STORAGE_KEY,
      JSON.stringify(normalizedArchivedGroups),
    ).catch(() => {
      // Keep inbox usable even if local persistence fails.
    });
  }, [archivedGroups, isArchiveStateLoaded, normalizedArchivedGroups]);

  const archiveGroup = async (group: GroupedCustomerNotification) => {
    setArchivedGroups((current) => ({
      ...current,
      [group.key]: {
        latestNotificationId: group.latest.id,
        archivedAt: new Date().toISOString(),
      },
    }));
  };

  return {
    archivedGroups: normalizedArchivedGroups,
    archiveGroup,
    isArchiveStateLoaded,
  };
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
