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
          borderColor: "rgba(255,255,255,0.14)",
        },
      ]}
    >
      <View style={styles.mainRow}>
        <ImageFrame source={imageUrl} categorySlug={appointment.category_slug} label={appointment.service_name ?? "Premium care"} />
        <View style={styles.jobCopy}>
          <View style={styles.categoryLine}>
            <Ionicons name={getCategoryIcon(appointment.category_slug)} size={24} color={surface === "dark" ? "rgba(255,255,255,0.78)" : theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="caption" weight="bold" color={surface === "dark" ? "rgba(255,255,255,0.76)" : theme.colors.textMuted}>
                {(appointment.category_name ?? "Care").toUpperCase()}
              </Text>
              <Text variant="caption" color={surface === "dark" ? "rgba(255,255,255,0.64)" : theme.colors.textMuted} numberOfLines={2}>
                {appointment.service_name ?? "Premium care"}
              </Text>
            </View>
          </View>

          <Text variant="h3" weight="bold" style={surface === "dark" ? styles.darkTitle : undefined} numberOfLines={2}>
            {appointment.service_name ?? "Appointment"}
          </Text>
          <Text color={surface === "dark" ? "rgba(255,255,255,0.82)" : theme.colors.textSecondary} style={styles.customerName} numberOfLines={2}>
            {appointment.customer_name ?? "Customer"}
          </Text>

          <View style={styles.badges}>
            <StatusBadge label={nextActionLabel} tone={tone} />
            {appointment.category_name ? <StatusBadge label={appointment.category_name} tone="primary" /> : null}
            <AppointmentStatusBadge status={appointment.status} />
            {!appointment.provider_name ? <StatusBadge label="Unassigned" tone="warning" /> : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={surface === "dark" ? "rgba(255,255,255,0.86)" : theme.colors.textMuted} />
      </View>

      <View style={[styles.infoGrid, { backgroundColor: surface === "dark" ? "rgba(255,255,255,0.06)" : theme.colors.surfaceMuted, borderColor: surface === "dark" ? "rgba(255,255,255,0.08)" : theme.colors.borderSoft }]}>
        <InfoRow icon="calendar-outline" label="Scheduled" value={formatSchedule(appointment.start_time)} surface={surface} />
        <InfoRow icon="person-outline" label="Provider" value={appointment.provider_name ?? "Needs assignment"} surface={surface} />
        <InfoRow icon="location-outline" label="Area" value={location || "Address pending"} surface={surface} />
      </View>
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

function getCategoryIcon(categorySlug?: string | null): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    shoes: "footsteps-outline",
    laundry: "basket-outline",
    "dry-cleaning": "shirt-outline",
    "handbags-leather": "bag-handle-outline",
    "rugs-textiles": "albums-outline",
    alterations: "cut-outline",
  };

  return categorySlug ? icons[categorySlug] ?? "sparkles-outline" : "sparkles-outline";
}

function formatSchedule(value: string) {
  const date = new Date(value);
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day}\n${time}`;
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

function InfoRow({
  icon,
  label,
  value,
  surface,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  surface: "light" | "dark";
}) {
  const theme = useTheme();
  const isDark = surface === "dark";
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={isDark ? theme.colors.accent : theme.colors.primary} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color={isDark ? "rgba(255,255,255,0.64)" : theme.colors.textMuted}>
          {label}
        </Text>
        <Text weight="bold" style={{ color: isDark ? theme.colors.surfaceElevated : theme.colors.textPrimary }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    borderRadius: 18,
  },
  media: {
    width: 116,
    height: 132,
    minHeight: 132,
    borderRadius: 10,
    overflow: "hidden",
  },
  mediaImage: {
    borderRadius: 10,
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
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  jobCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  categoryLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  darkTitle: {
    color: "#FFFFFF",
  },
  customerName: {
    fontSize: 16,
    lineHeight: 21,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  infoGrid: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoRow: {
    flex: 1,
    minWidth: 126,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
});

export default OwnerJobCard;
