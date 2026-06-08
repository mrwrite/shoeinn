import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { Company } from "../types/company";
import { getProviderCategoryLabel } from "../discovery/categoryMetadata";
import { getMarketplaceVisual, getPrimaryCategorySlug } from "../discovery/marketplaceVisuals";
import { PressableCard } from "./ui/Card";
import { MediaPlaceholder } from "./ui/MediaPlaceholder";
import { StatusBadge } from "./ui/StatusBadge";
import { Text } from "./ui/Text";

interface Props {
  company: Company;
  onPress?: (company: Company) => void;
}

export function ProviderCard({ company, onPress }: Props) {
  const theme = useTheme();
  const location = [company.city, company.state].filter(Boolean).join(", ") || "Location unknown";
  const categoryLabel = getProviderCategoryLabel(company);
  const primaryCategorySlug = getPrimaryCategorySlug(company.offered_categories);
  const categories = company.offered_categories?.slice(0, 3) ?? [];

  return (
    <PressableCard
      onPress={() => onPress?.(company)}
      variant="marketplace"
      accessibilityLabel={`Open provider ${company.name}, ${location}`}
      style={styles.card}
    >
      <MediaPlaceholder
        categorySlug={primaryCategorySlug}
        label={company.city ?? "Nearby"}
        caption="Vetted local care team"
        style={styles.media}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h3" weight="bold">
              {company.name}
            </Text>
            <Text color={theme.colors.textSecondary} style={{ marginTop: 4 }}>
              {location}
            </Text>
          </View>
          <StatusBadge label="Open" tone="success" />
        </View>
        {categories.length > 0 ? (
          <View style={styles.categoryRow}>
            {categories.map((category) => (
              <View key={category.slug} style={[styles.categoryPill, { backgroundColor: getMarketplaceVisual(category.slug).softColor }]}>
                <Ionicons
                  name={getMarketplaceVisual(category.slug).iconName as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={theme.colors.primary}
                />
                <Text variant="caption" weight="bold" color={theme.colors.textSecondary} numberOfLines={1} style={styles.pillText}>
                  {category.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <View style={[styles.metaPill, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.secondary} />
            <Text variant="caption" weight="bold" color={theme.colors.textSecondary} style={styles.pillText}>
              {categoryLabel}
            </Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Ionicons name="time-outline" size={15} color={theme.colors.primary} />
            <Text variant="caption" weight="bold" color={theme.colors.textSecondary} style={styles.pillText}>
              Pickup windows
            </Text>
          </View>
        </View>
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    maxWidth: "100%",
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaPill: {
    maxWidth: "100%",
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: {
    flexShrink: 1,
  },
});

export default ProviderCard;
