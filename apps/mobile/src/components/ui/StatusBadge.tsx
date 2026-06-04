import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { getReadableAppointmentStatus } from "../../features/appointmentCopy";
import { Text } from "./Text";

type StatusTone = "neutral" | "primary" | "success" | "warning" | "danger";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  style?: StyleProp<ViewStyle>;
};

const appointmentToneByStatus: Record<string, StatusTone> = {
  requested: "primary",
  confirmed: "primary",
  pending_payment: "warning",
  payment_failed: "danger",
  en_route: "primary",
  en_route_pickup: "primary",
  picked_up: "primary",
  in_progress: "warning",
  cleaning: "warning",
  ready: "success",
  out_for_delivery: "primary",
  delivered: "success",
  completed: "neutral",
  cancelled: "neutral",
};

/**
 * StatusBadge standardizes pill styling for appointment, payment, provider,
 * admin, and notification states. Pass a raw lifecycle status via `fromStatus`
 * when the screen already has backend status strings.
 */
export function StatusBadge({ label, tone = "neutral", style }: StatusBadgeProps) {
  const theme = useTheme();
  const palette = {
    neutral: {
      text: theme.colors.textSecondary,
      background: theme.colors.surfaceMuted,
      border: theme.colors.borderSoft,
    },
    primary: {
      text: theme.colors.primary,
      background: theme.colors.surfaceTint,
      border: `${theme.colors.primary}2E`,
    },
    success: {
      text: theme.colors.success,
      background: theme.colors.successSoft,
      border: `${theme.colors.success}30`,
    },
    warning: {
      text: theme.colors.warning,
      background: theme.colors.warningSoft,
      border: `${theme.colors.warning}34`,
    },
    danger: {
      text: theme.colors.danger,
      background: theme.colors.dangerSoft,
      border: `${theme.colors.danger}30`,
    },
  }[tone];

  return (
    <View
      accessibilityLabel={`Status: ${label}`}
      style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }, style]}
    >
      <Text variant="caption" weight="bold" style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  );
}

export function AppointmentStatusBadge({ status, label }: { status: string; label?: string }) {
  const readable = label ?? getReadableAppointmentStatus(status);
  return <StatusBadge label={readable} tone={appointmentToneByStatus[status] ?? "neutral"} />;
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default StatusBadge;
