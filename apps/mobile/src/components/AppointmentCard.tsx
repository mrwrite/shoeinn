import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { AppointmentSummary } from "../types/booking";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

type Props = {
  appointment: AppointmentSummary;
  onPress?: (appointment: AppointmentSummary) => void;
  onClaim?: (appointment: AppointmentSummary) => void;
  claimable?: boolean;
  helperText?: string;
  actionLabel?: string;
  emphasis?: "actionable" | "owned" | "neutral";
};

const statusColors: Record<string, string> = {
  confirmed: "#1B998B",
  requested: "#0F4C5C",
  cleaning: "#E6AF2E",
  ready: "#2EC4B6",
  out_for_delivery: "#2EC4B6",
  delivered: "#1B998B",
  completed: "#059669",
  cancelled: "#9CA3AF",
};

export function AppointmentCard({
  appointment,
  onPress,
  onClaim,
  claimable,
  helperText,
  actionLabel,
  emphasis = "neutral",
}: Props) {
  const theme = useTheme();
  const statusColor = statusColors[appointment.status] ?? theme.colors.mutedText;
  const actionTone = {
    actionable: { background: "#ecfdf5", border: "#86efac", text: "#166534" },
    owned: { background: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
    neutral: { background: "#f3f4f6", border: theme.colors.border, text: theme.colors.mutedText },
  }[emphasis];

  return (
    <Pressable onPress={() => onPress?.(appointment)} style={{ marginBottom: 12 }}>
      <Card>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text weight="semibold">{appointment.service_name ?? "Appointment"}</Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              {new Date(appointment.start_time).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}> 
            <Text weight="semibold" style={{ color: statusColor }}>
              {appointment.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
        <View style={styles.metaBlock}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.mutedText} />
            <Text style={styles.metaText} color={theme.colors.mutedText}>
              {new Date(appointment.start_time).toLocaleString()}
            </Text>
          </View>
          {appointment.city ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={theme.colors.mutedText} />
              <Text style={styles.metaText} color={theme.colors.mutedText}>
                {[appointment.city, appointment.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={16} color={theme.colors.mutedText} />
            <Text style={styles.metaText} color={theme.colors.mutedText}>
              {appointment.customer_name}
            </Text>
          </View>
        </View>
        {actionLabel ? (
          <View
            style={[
              styles.actionPill,
              {
                backgroundColor: actionTone.background,
                borderColor: actionTone.border,
              },
            ]}
          >
            <Text weight="semibold" style={{ color: actionTone.text }}>
              {actionLabel}
            </Text>
          </View>
        ) : null}
        {claimable ? (
          <View style={styles.claimSection}>
            {helperText ? (
              <Text variant="caption" color={theme.colors.mutedText}>
                {helperText}
              </Text>
            ) : null}
            <Button
              label="Claim appointment"
              onPress={() => onClaim?.(appointment)}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  metaBlock: {
    marginTop: 10,
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 6,
  },
  actionPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  claimSection: {
    marginTop: 12,
  },
});

export default AppointmentCard;
