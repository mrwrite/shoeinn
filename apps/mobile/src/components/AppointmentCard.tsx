import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { AppointmentSummary } from "../types/booking";
import { Button } from "./ui/Button";
import { MediaPlaceholder } from "./ui/MediaPlaceholder";
import { PressableCard } from "./ui/Card";
import { AppointmentStatusBadge, StatusBadge } from "./ui/StatusBadge";
import { Text } from "./ui/Text";

type Props = {
  appointment: AppointmentSummary;
  onPress?: (appointment: AppointmentSummary) => void;
  onClaim?: (appointment: AppointmentSummary) => void;
  claimable?: boolean;
  claimDisabled?: boolean;
  claimLoading?: boolean;
  helperText?: string;
  actionLabel?: string;
  emphasis?: "actionable" | "owned" | "neutral";
};

function getPaymentLabel(appointment: AppointmentSummary): { label: string; tone: "success" | "warning" | "danger" } | null {
  if (appointment.payment_mode !== "service") {
    return null;
  }
  if (appointment.payment_status === "succeeded") {
    return { label: "Paid", tone: "success" };
  }
  if (appointment.payment_status === "failed" || appointment.status === "payment_failed") {
    return { label: "Payment failed", tone: "danger" };
  }
  if (appointment.payment_status === "requires_action" || appointment.status === "pending_payment") {
    return { label: appointment.payment_checkout_url ? "Complete payment" : "Payment pending", tone: "warning" };
  }
  if (appointment.payment_status === "pending") {
    return { label: "Payment pending", tone: "warning" };
  }
  return null;
}

export function AppointmentCard({
  appointment,
  onPress,
  onClaim,
  claimable,
  claimDisabled,
  claimLoading,
  helperText,
  actionLabel,
  emphasis = "neutral",
}: Props) {
  const theme = useTheme();
  const payment = getPaymentLabel(appointment);
  const area = [appointment.city, appointment.state].filter(Boolean).join(", ") || "Location pending";
  const appointmentDate = new Date(appointment.start_time);
  const actionTone = emphasis === "actionable" ? "success" : emphasis === "owned" ? "primary" : "neutral";
  const accessibilityLabel = `Open appointment ${appointment.service_name ?? "appointment"} for ${
    appointment.customer_name ?? "customer"
  }, status ${appointment.status.replace(/_/g, " ")}`;

  return (
    <PressableCard
      onPress={() => onPress?.(appointment)}
      variant={emphasis === "actionable" ? "elevated" : "marketplace"}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        emphasis === "actionable" && { borderColor: `${theme.colors.success}44` },
      ]}
    >
      <MediaPlaceholder
        compact
        categorySlug={appointment.category_slug}
        label={appointment.category_name ?? "Care appointment"}
        caption={appointment.service_name ?? "Premium care"}
        style={styles.media}
      />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="h3" weight="bold">
            {appointment.service_name ?? "Appointment"}
          </Text>
          <Text color={theme.colors.textSecondary} style={styles.subcopy}>
            {claimable ? "Review the job details, then claim when ready." : "Track pickup, care progress, payment, and delivery."}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>

      <View style={styles.badges}>
        {actionLabel ? <StatusBadge label={actionLabel} tone={actionTone} /> : null}
        {appointment.category_name ? <StatusBadge label={appointment.category_name} tone="primary" /> : null}
        <AppointmentStatusBadge status={appointment.status} />
        {payment ? <StatusBadge label={payment.label} tone={payment.tone} /> : null}
      </View>

      <View style={[styles.infoPanel, { backgroundColor: theme.colors.surfaceMuted }]}>
        <InfoRow icon="calendar-outline" label="When" value={appointmentDate.toLocaleString()} />
        <InfoRow icon="storefront-outline" label="Provider" value={appointment.company_id ? "Selected company" : "Matching provider"} />
        <InfoRow icon="location-outline" label="Area" value={area} />
      </View>

      {helperText ? (
        <View style={[styles.helperCard, { backgroundColor: theme.colors.warningSoft, borderColor: `${theme.colors.warning}33` }]}>
          <Text variant="caption" color={theme.colors.textSecondary}>
            {helperText}
          </Text>
        </View>
      ) : null}

      {claimable ? (
        <Button
          label={claimLoading ? "Claiming..." : "Claim appointment"}
          onPress={() => onClaim?.(appointment)}
          disabled={claimDisabled || claimLoading}
          loading={claimLoading}
          style={styles.claimButton}
        />
      ) : null}
    </PressableCard>
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
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <View style={styles.infoCopy}>
        <Text variant="caption" color={theme.colors.textMuted}>
          {label}
        </Text>
        <Text weight="bold">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    gap: 14,
    padding: 0,
    overflow: "hidden",
  },
  media: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  infoPanel: {
    borderRadius: 20,
    padding: 12,
    gap: 10,
    marginHorizontal: 16,
  },
  helperCard: {
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  subcopy: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  claimButton: {
    marginTop: 2,
    marginHorizontal: 16,
    marginBottom: 16,
  },
});

export default AppointmentCard;
