import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ProviderAppointment } from "../types/company";
import { useTheme } from "../theme/theme";
import { PressableCard } from "./ui/Card";
import { MediaPlaceholder } from "./ui/MediaPlaceholder";
import { AppointmentStatusBadge, StatusBadge } from "./ui/StatusBadge";
import { Text } from "./ui/Text";

type Props = {
  appointment: ProviderAppointment;
  emphasis?: "priority" | "ready" | "active" | "neutral";
  nextActionLabel: string;
  onPress: () => void;
  surface?: "light" | "dark";
};

export function OwnerJobCard({ appointment, emphasis = "neutral", nextActionLabel, onPress, surface = "light" }: Props) {
  const theme = useTheme();
  const location = [appointment.city ?? appointment.customer_city, appointment.state ?? appointment.customer_state]
    .filter(Boolean)
    .join(", ");
  const tone = emphasis === "priority" ? "danger" : emphasis === "ready" ? "success" : emphasis === "active" ? "primary" : "neutral";
  const accessibilityLabel = `Open owner job ${appointment.service_name ?? "appointment"} for ${
    appointment.customer_name ?? "customer"
  }, status ${appointment.status.replace(/_/g, " ")}`;
  const imageUrl = getJobImageUrl(appointment.category_slug);

  return (
    <PressableCard
      onPress={onPress}
      variant={emphasis === "priority" ? "elevated" : "marketplace"}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        surface === "dark" && {
          backgroundColor: "rgba(8, 43, 51, 0.9)",
          borderColor: "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <ImageFrame source={imageUrl} categorySlug={appointment.category_slug} label={appointment.service_name ?? "Premium care"} />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="h3" weight="bold" style={surface === "dark" ? { color: theme.colors.surfaceElevated } : undefined}>
            {appointment.service_name ?? "Appointment"}
          </Text>
          <Text color={surface === "dark" ? "rgba(255,255,255,0.74)" : theme.colors.textSecondary} style={styles.subcopy}>
            {appointment.customer_name ?? "Customer"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={surface === "dark" ? "rgba(255,255,255,0.72)" : theme.colors.textMuted} />
      </View>

      <View style={styles.badges}>
        <StatusBadge label={nextActionLabel} tone={tone} />
        {appointment.category_name ? <StatusBadge label={appointment.category_name} tone="primary" /> : null}
        <AppointmentStatusBadge status={appointment.status} />
        <StatusBadge label={appointment.provider_name ? "Assigned" : "Unassigned"} tone={appointment.provider_name ? "success" : "warning"} />
      </View>

      <View style={[styles.infoGrid, { backgroundColor: surface === "dark" ? "rgba(255,255,255,0.06)" : theme.colors.surfaceMuted, borderColor: surface === "dark" ? "rgba(255,255,255,0.08)" : theme.colors.borderSoft }]}>
        <InfoRow icon="calendar-outline" label="Scheduled" value={new Date(appointment.start_time).toLocaleString()} />
        <InfoRow icon="person-outline" label="Provider" value={appointment.provider_name ?? "Needs assignment"} />
        <InfoRow icon="location-outline" label="Area" value={location || "Address pending"} />
      </View>

      <Text variant="caption" color={surface === "dark" ? "rgba(255,255,255,0.64)" : theme.colors.textMuted}>
        {appointment.provider_name ? "Open to review assignment, progress, and next action." : "Open to assign this job and review customer details."}
      </Text>
    </PressableCard>
  );
}

const JOB_IMAGES: Record<string, string> = {
  shoes: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80",
  laundry: "https://images.unsplash.com/photo-1542089363-7a1e6c5c1b1d?auto=format&fit=crop&w=1200&q=80",
  "dry-cleaning": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  "handbags-leather": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=80",
  "rugs-textiles": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
  alterations: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
};

function getJobImageUrl(categorySlug?: string | null) {
  return categorySlug ? JOB_IMAGES[categorySlug] ?? JOB_IMAGES.shoes : JOB_IMAGES.shoes;
}

function ImageFrame({
  source,
  categorySlug,
  label,
}: {
  source: string;
  categorySlug?: string | null;
  label: string;
}) {
  const [error, setError] = React.useState(false);
  const theme = useTheme();
  if (error) {
    return (
      <MediaPlaceholder
        compact
        categorySlug={categorySlug}
        label={label}
        caption="Premium care"
        style={styles.media}
      />
    );
  }

  return (
    <ImageBackground source={{ uri: source }} resizeMode="cover" style={styles.media} imageStyle={styles.mediaImage} onError={() => setError(true)}>
      <View style={[styles.mediaOverlay, { backgroundColor: "rgba(14, 18, 20, 0.18)" }]}>
        <View style={[styles.mediaAccent, { backgroundColor: theme.colors.accent }]} />
      </View>
    </ImageBackground>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={theme.colors.accent} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="rgba(255,255,255,0.64)">
          {label}
        </Text>
        <Text weight="bold" style={{ color: theme.colors.surfaceElevated }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 0,
    overflow: "hidden",
  },
  media: {
    minHeight: 138,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  mediaImage: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  mediaOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  mediaAccent: {
    width: 44,
    height: 6,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
  },
  subcopy: {
    marginTop: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  infoGrid: {
    borderRadius: 18,
    padding: 12,
    gap: 10,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
});

export default OwnerJobCard;
