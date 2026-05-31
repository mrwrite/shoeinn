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
  pending_payment: "#b45309",
  payment_failed: "#dc2626",
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
  const paymentStatus = appointment.payment_status ?? null;
  const paymentLabel = (() => {
    if (appointment.payment_mode !== "service") {
      return null;
    }
    if (paymentStatus === "succeeded") {
      return "Paid";
    }
    if (paymentStatus === "failed" || appointment.status === "payment_failed") {
      return "Payment failed";
    }
    if (paymentStatus === "requires_action" || appointment.status === "pending_payment") {
      return appointment.payment_checkout_url ? "Complete payment" : "Payment pending";
    }
    if (paymentStatus === "pending") {
      return "Payment pending";
    }
    return null;
  })();
  const paymentTone = (() => {
    if (paymentLabel === "Paid") {
      return { backgroundColor: "#ecfdf5", borderColor: "#86efac", color: "#166534" };
    }
    if (paymentLabel === "Payment failed") {
      return { backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" };
    }
    return { backgroundColor: "#fffbeb", borderColor: "#fde68a", color: "#92400e" };
  })();
  const actionTone = {
    actionable: { background: "#ecfdf5", border: "#86efac", text: "#166534", accent: "#0f766e" },
    owned: { background: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", accent: "#1d4ed8" },
    neutral: {
      background: "#f8fafc",
      border: theme.colors.border,
      text: theme.colors.mutedText,
      accent: theme.colors.mutedText,
    },
  }[emphasis];

  return (
    <Pressable onPress={() => onPress?.(appointment)} style={({ pressed }) => [{ marginBottom: 14 }, pressed && { opacity: 0.96 }]}>
      <Card style={[styles.card, emphasis === "actionable" && styles.cardActionable]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.labelRow}>
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
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}55` }]}>
                <Text weight="semibold" style={{ color: statusColor }}>
                  {appointment.status.replace(/_/g, " ")}
                </Text>
              </View>
              {paymentLabel ? (
                <View style={[styles.statusPill, paymentTone]}>
                  <Text weight="semibold" style={{ color: paymentTone.color }}>
                    {paymentLabel}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="subtitle" weight="semibold" style={{ marginTop: 12 }}>
              {appointment.service_name ?? "Appointment"}
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              {claimable ? "Review the job details, then claim when you are ready." : "Open the job for current progress, route details, and updates."}
            </Text>
          </View>
        </View>

        <View style={styles.infoPanel}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={actionTone.accent} />
            <View style={styles.metaCopy}>
              <Text weight="semibold">When</Text>
              <Text color={theme.colors.mutedText}>
                {new Date(appointment.start_time).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={actionTone.accent} />
            <View style={styles.metaCopy}>
              <Text weight="semibold">Where</Text>
              <Text color={theme.colors.mutedText}>
                {[appointment.city, appointment.state].filter(Boolean).join(", ") || "Location pending"}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={16} color={actionTone.accent} />
            <View style={styles.metaCopy}>
              <Text weight="semibold">Customer</Text>
              <Text color={theme.colors.mutedText}>
                {appointment.customer_name}
              </Text>
            </View>
          </View>
        </View>

        {helperText ? (
          <View style={styles.helperCard}>
            <Text variant="caption" color={theme.colors.mutedText}>
              {helperText}
            </Text>
          </View>
        ) : null}

        {claimable ? (
          <Button
            label="Claim appointment"
            onPress={() => onClaim?.(appointment)}
            style={styles.claimButton}
          />
        ) : (
          <View style={styles.footerHint}>
            <Ionicons name="arrow-forward-circle-outline" size={16} color={theme.colors.mutedText} />
            <Text variant="caption" color={theme.colors.mutedText}>
              Tap anywhere on the card to open job details.
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  cardActionable: {
    borderColor: "#b7f3d0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  actionPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  infoPanel: {
    gap: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  helperCard: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fffbea",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  claimButton: {
    marginTop: 2,
  },
  footerHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default AppointmentCard;
