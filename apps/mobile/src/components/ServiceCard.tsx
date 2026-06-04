import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getServiceCategoryLabel } from "../discovery/categoryMetadata";
import { getMarketplaceVisual } from "../discovery/marketplaceVisuals";
import { useTheme } from "../theme/theme";
import type { Service } from "../types/booking";
import { Button } from "./ui/Button";
import { PressableCard } from "./ui/Card";
import { MediaPlaceholder } from "./ui/MediaPlaceholder";
import { Text } from "./ui/Text";

interface Props {
  service: Service;
  onPress?: (service: Service) => void;
  onBook?: (service: Service) => void;
}

export function ServiceCard({ service, onPress, onBook }: Props) {
  const theme = useTheme();
  const price = service.price_cents ? service.price_cents / 100 : undefined;
  const categoryLabel = getServiceCategoryLabel(service);
  const visual = getMarketplaceVisual(service.category_slug);

  return (
    <PressableCard
      onPress={() => onPress?.(service)}
      variant="marketplace"
      accessibilityLabel={`Open service ${service.name}${price ? `, $${price.toFixed(2)}` : ""}`}
      style={styles.card}
    >
      <View>
        <MediaPlaceholder
          categorySlug={service.category_slug}
          label={categoryLabel || "Care service"}
          caption="Pickup-ready service"
          style={styles.media}
        />
        <View style={[styles.durationBadge, { backgroundColor: visual.accentColor }]}>
          <Text variant="caption" weight="bold" style={{ color: theme.colors.textPrimary }}>
            {service.duration_minutes} mins
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text variant="h3" weight="bold">
              {service.name}
            </Text>
            <Text variant="body" color={theme.colors.textSecondary} style={{ marginTop: 5 }} numberOfLines={2}>
              {service.description || "Premium care by trusted local specialists."}
            </Text>
          </View>
          <View style={[styles.priceLockup, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
              From
            </Text>
            <Text weight="bold" color={theme.colors.primary}>
              {price ? `$${price.toFixed(2)}` : "Pricing"}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaItem, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.secondary} />
            <Text weight="bold" color={theme.colors.textSecondary} style={{ marginLeft: 6 }}>
              Inspected care
            </Text>
          </View>
          <View style={[styles.metaItem, { backgroundColor: visual.softColor }]}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={{ marginLeft: 6 }} color={theme.colors.textSecondary} weight="bold">
              Pickup
            </Text>
          </View>
        </View>

        <Button
          label="Book service"
          variant="gold"
          rightIcon={<Ionicons name="arrow-forward" size={18} color={theme.colors.textPrimary} />}
          onPress={() => onBook?.(service)}
          style={{ marginTop: 12 }}
        />
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 0,
    overflow: "hidden",
  },
  media: {
    minHeight: 184,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  durationBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  content: {
    padding: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  priceLockup: {
    minWidth: 78,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  metaItem: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default ServiceCard;
