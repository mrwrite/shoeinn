import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

const includedItems = [
  "Professional cleaning and inspection",
  "Premium materials and gentle care",
  "Status updates every step",
];

export default function ServiceDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "ServiceDetail">>();
  const { service } = route.params;
  const price = service.price_cents ? service.price_cents / 100 : undefined;
  const categoryLabel = getServiceCategoryLabel(service);

  return (
    <AppScreen
      scrollable
      contentContainerStyle={{ paddingBottom: 100 }}
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Continue booking"
            variant="gold"
            onPress={() => navigation.navigate("BookingDate", { service })}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <Card variant="marketplace" style={styles.heroCard}>
          <MediaPlaceholder
            categorySlug={service.category_slug}
            label={service.name}
            caption={categoryLabel ?? "Premium care service"}
            style={styles.heroMedia}
          />
          <View style={styles.heroContent}>
            <SectionHeader
              eyebrow={categoryLabel ?? "Care service"}
              title={service.name}
              subtitle="Premium local care with pickup and delivery."
            />
            <View style={styles.heroMetaRow}>
              {categoryLabel ? <StatusBadge label={categoryLabel} tone="primary" /> : null}
              <StatusBadge label={price ? `$${price.toFixed(2)}` : "Pricing"} tone="warning" />
              <StatusBadge label={`${service.duration_minutes} mins`} tone="neutral" />
            </View>
          </View>
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="About this service" subtitle="A care-focused experience from pickup to return." />
          <Text color={theme.colors.textSecondary} style={{ marginTop: 8 }}>
            {service.description || "Book trusted care with transparent pricing and flexible scheduling."}
          </Text>
        </Card>

        <Card variant="compact" style={styles.detailGrid}>
          <DetailMetric label="Starting price" value={price ? `$${price.toFixed(2)}` : "Quoted"} icon="card-outline" />
          <DetailMetric label="Turnaround" value={`${service.duration_minutes} mins`} icon="time-outline" />
          <DetailMetric label="Category" value={categoryLabel ?? "Care service"} icon="sparkles-outline" />
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="What's included" subtitle="A simple care path from booking to delivery." />
          <View style={styles.includedList}>
            {includedItems.map((item) => (
              <View key={item} style={styles.includedRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.secondary} />
                <Text color={theme.colors.textPrimary} style={{ flex: 1 }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </AppScreen>
  );
}

function DetailMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.metric, { backgroundColor: theme.colors.surfaceMuted }]}>
      <View style={[styles.metricIcon, { backgroundColor: theme.colors.accentSoft }]}>
        <Ionicons name={icon} size={17} color={theme.colors.primary} />
      </View>
      <Text variant="meta" weight="bold" color={theme.colors.textMuted}>
        {label}
      </Text>
      <Text weight="bold" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    padding: 0,
    overflow: "hidden",
  },
  heroMedia: {
    minHeight: 210,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroContent: {
    padding: 16,
    gap: 12,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailGrid: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  metric: {
    flex: 1,
    minHeight: 112,
    borderRadius: 18,
    padding: 10,
    gap: 7,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  includedList: {
    marginTop: 12,
    gap: 10,
  },
  includedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerContent: {
    flexDirection: "row",
  },
});
