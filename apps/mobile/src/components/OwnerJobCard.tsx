import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ProviderAppointment } from "../types/company";
import { useTheme } from "../theme/theme";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

type Props = {
  appointment: ProviderAppointment;
  emphasis?: "priority" | "ready" | "active" | "neutral";
  nextActionLabel: string;
  onPress: () => void;
};

const statusColors: Record<string, string> = {
  confirmed: "#0F4C5C",
  en_route_pickup: "#0F766E",
  picked_up: "#0F766E",
  cleaning: "#B45309",
  ready: "#166534",
  out_for_delivery: "#0E7490",
  delivered: "#0F766E",
  completed: "#4B5563",
  cancelled: "#9CA3AF",
  requested: "#1D4ED8",
};

export function OwnerJobCard({ appointment, emphasis = "neutral", nextActionLabel, onPress }: Props) {
  const theme = useTheme();
  const statusColor = statusColors[appointment.status] ?? theme.colors.peacockPrimary;
  const emphasisPalette = {
    priority: { bg: "#FEF2F2", border: "#FECACA", label: "#B91C1C" },
    ready: { bg: "#ECFDF5", border: "#86EFAC", label: "#166534" },
    active: { bg: "#EFF6FF", border: "#BFDBFE", label: "#1D4ED8" },
    neutral: { bg: "#F8FAFC", border: "#E2E8F0", label: theme.colors.mutedText },
  }[emphasis];

  const location = [appointment.city ?? appointment.customer_city, appointment.state ?? appointment.customer_state]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.96 }]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={[styles.emphasisPill, { backgroundColor: emphasisPalette.bg, borderColor: emphasisPalette.border }]}>
            <Text variant="caption" weight="semibold" style={{ color: emphasisPalette.label }}>
              {nextActionLabel}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}14`, borderColor: `${statusColor}44` }]}>
            <Text variant="caption" weight="semibold" style={{ color: statusColor }}>
              {appointment.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        <Text variant="subtitle" weight="bold" style={{ marginTop: 12 }}>
          {appointment.service_name ?? "Appointment"}
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
          {appointment.customer_name ?? "Customer"}
        </Text>

        <View style={styles.infoGrid}>
          <InfoRow icon="calendar-outline" label="Scheduled" value={new Date(appointment.start_time).toLocaleString()} />
          <InfoRow icon="person-outline" label="Assigned" value={appointment.provider_name ?? "Unassigned"} />
          <InfoRow icon="location-outline" label="Area" value={location || "Address pending"} />
        </View>

        <View style={styles.footer}>
          <Text variant="caption" color={theme.colors.mutedText}>
            {appointment.provider_name
              ? "Open to review assignment, progress, and next action."
              : "Open to review details and assign this pickup."}
          </Text>
          <Ionicons name="arrow-forward-circle-outline" size={18} color={theme.colors.peacockPrimary} />
        </View>
      </Card>
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={theme.colors.peacockPrimary} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color={theme.colors.mutedText}>
          {label}
        </Text>
        <Text weight="semibold">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  emphasisPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoGrid: {
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    padding: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
});

export default OwnerJobCard;
