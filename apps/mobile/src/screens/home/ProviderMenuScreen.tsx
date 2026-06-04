import React, { useMemo } from "react";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { listServices } from "../../api/http";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card, PressableCard } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { filterServicesByCategory } from "../../discovery/categoryDiscovery";
import { getProviderCategoryLabel, getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import { getMarketplaceVisual, getPrimaryCategorySlug } from "../../discovery/marketplaceVisuals";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import type { Service } from "../../types/booking";

const PROVIDER_HERO_IMAGES: Record<string, string> = {
  shoes: "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?auto=format&fit=crop&w=1600&q=85",
  laundry: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1600&q=85",
  "dry-cleaning": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=85",
  "handbags-leather": "https://images.unsplash.com/photo-1590739225281-94f30275c91c?auto=format&fit=crop&w=1600&q=85",
};

const SERVICE_IMAGES: Record<string, string> = {
  shoes: "https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?auto=format&fit=crop&w=900&q=80",
  laundry: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=900&q=80",
  "dry-cleaning": "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=900&q=80",
  "handbags-leather": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
  "rugs-textiles": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
  alterations: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80",
};

export default function ProviderMenuScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "ProviderMenu">>();
  const { company, categorySlug, categoryName } = route.params;
  const location = [company.city, company.state].filter(Boolean).join(", ") || "Serving your area";
  const categoryLabel = getProviderCategoryLabel(company);
  const primaryCategorySlug = categorySlug ?? getPrimaryCategorySlug(company.offered_categories);
  const visual = getMarketplaceVisual(primaryCategorySlug);

  const servicesQuery = useQuery<Service[]>({
    queryKey: ["services", company.id, categorySlug ?? "all"],
    queryFn: () => listServices({ companyId: company.id, categorySlug }),
  });

  const services = useMemo(
    () =>
      filterServicesByCategory(servicesQuery.data ?? [], categorySlug ?? null).map((svc) => ({
        ...svc,
        company_id: svc.company_id ?? company.id,
      })),
    [servicesQuery.data, company.id, categorySlug],
  );

  const featuredService = services[0] ?? null;
  const serviceCountLabel = services.length > 0 ? `${services.length} services` : "Service menu";

  return (
    <AppScreen
      scrollable
      contentContainerStyle={styles.container}
      stickyFooter={
        featuredService ? (
          <Button
            label="Book Service"
            variant="gold"
            onPress={() => navigation.navigate("BookingDate", { service: featuredService })}
          />
        ) : null
      }
    >
      <View style={styles.heroWrap}>
        <ImageBackground
          source={{ uri: getProviderHeroImage(primaryCategorySlug) }}
          resizeMode="cover"
          style={styles.heroImage}
          imageStyle={styles.heroImageRadius}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroTopBar}>
              <RoundIconButton icon="chevron-back" label="Go back" onPress={() => navigation.goBack()} />
              <View style={styles.heroActions}>
                <RoundIconButton icon="share-outline" label="Share provider" onPress={() => undefined} />
                <RoundIconButton icon="heart-outline" label="Save provider" onPress={() => undefined} />
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <Card variant="marketplace" style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={[styles.logoBadge, { backgroundColor: visual.backgroundColor, borderColor: theme.colors.accent }]}>
            <Text variant="h2" weight="regular" style={styles.logoText}>
              {getProviderInitials(company.name)}
            </Text>
          </View>

          <View style={styles.providerCopy}>
            <Text variant="display" weight="regular" style={styles.providerTitle} numberOfLines={2}>
              {company.name}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={24} color={theme.colors.accent} />
              <Text variant="h3" weight="bold">
                4.9
              </Text>
              <Text variant="bodySmall" color={theme.colors.textMuted}>
                (2,340 reviews)
              </Text>
            </View>
            <View style={styles.trustRow}>
              <View style={[styles.verifiedPill, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View style={[styles.verifiedIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="checkmark" size={14} color={theme.colors.surfaceElevated} />
                </View>
                <Text variant="bodySmall" weight="semibold">
                  Verified Provider
                </Text>
              </View>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                7+ Years in Business
              </Text>
            </View>
          </View>
        </View>

        <Card variant="outline" style={styles.metricsCard}>
          <Metric icon="calendar-outline" value="12,840" label="Appointments Completed" />
          <View style={[styles.metricDivider, { backgroundColor: theme.colors.divider }]} />
          <Metric icon="happy-outline" value="99%" label="Satisfaction Rate" />
          <View style={[styles.metricDivider, { backgroundColor: theme.colors.divider }]} />
          <Metric icon="time-outline" value="1.2 hrs" label="Avg. Response Time" />
        </Card>

        <View style={styles.servicesHeader}>
          <Text variant="h2" weight="regular">
            Services
          </Text>
          <StatusBadge label={categoryName ?? categoryLabel} tone="primary" />
          <StatusBadge label={serviceCountLabel} tone="warning" />
        </View>

        {servicesQuery.isLoading ? (
          <LoadingState label="Loading services" />
        ) : servicesQuery.isError ? (
          <EmptyState title="Unable to load services" message="Check your connection and try again." icon="cloud-offline-outline" />
        ) : services.length === 0 ? (
          <EmptyState
            title="No services available"
            message={
              categoryName
                ? `${company.name} does not have ${categoryName.toLowerCase()} services available right now.`
                : "Please check back later."
            }
            icon="sparkles-outline"
          />
        ) : (
          <View style={styles.serviceList}>
            {services.map((svc) => (
              <ProviderServiceRow
                key={svc.id}
                service={svc}
                onPress={(service) => navigation.navigate("ServiceDetail", { service })}
              />
            ))}
          </View>
        )}
      </Card>
    </AppScreen>
  );
}

function RoundIconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.roundIcon, theme.shadows.soft]}>
      <Ionicons name={icon} size={28} color={theme.colors.textPrimary} />
    </Pressable>
  );
}

function Metric({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={31} color={theme.colors.accentPressed} />
      <Text variant="h2" weight="bold" style={styles.metricValue}>
        {value}
      </Text>
      <Text variant="bodySmall" color={theme.colors.textMuted} style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function ProviderServiceRow({ service, onPress }: { service: Service; onPress: (service: Service) => void }) {
  const theme = useTheme();
  const categoryLabel = getServiceCategoryLabel(service);
  const duration = formatDuration(service.duration_minutes);
  const price = service.price_cents ? `$${Math.round(service.price_cents / 100)}` : "Pricing";

  return (
    <PressableCard
      variant="outline"
      onPress={() => onPress(service)}
      accessibilityLabel={`Open service ${service.name}, ${price}`}
      style={styles.serviceRow}
    >
      <ServiceImage categorySlug={service.category_slug} label={service.name} />
      <View style={styles.serviceCopy}>
        <Text variant="h3" weight="bold" numberOfLines={2}>
          {service.name}
        </Text>
        <Text variant="bodySmall" color={theme.colors.textMuted} numberOfLines={2}>
          {service.description || "Premium care by trusted local specialists."}
        </Text>
        <View style={[styles.categoryPill, { backgroundColor: theme.colors.surfaceTint }]}>
          <Text variant="caption" weight="semibold" color={theme.colors.primary} numberOfLines={1}>
            {categoryLabel ?? "Care"}
          </Text>
        </View>
      </View>
      <View style={styles.priceColumn}>
        <Text variant="h2" weight="regular" color={theme.colors.primary}>
          {price}
        </Text>
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={17} color={theme.colors.textMuted} />
          <Text variant="bodySmall" color={theme.colors.textMuted}>
            {duration}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={25} color={theme.colors.textMuted} />
    </PressableCard>
  );
}

function ServiceImage({ categorySlug, label }: { categorySlug?: string | null; label: string }) {
  const [error, setError] = React.useState(false);
  if (error) {
    return <MediaPlaceholder compact categorySlug={categorySlug} label={label} style={styles.serviceImage} />;
  }

  return (
    <ImageBackground
      source={{ uri: getServiceImage(categorySlug) }}
      resizeMode="cover"
      style={styles.serviceImage}
      imageStyle={styles.serviceImageRadius}
      onError={() => setError(true)}
    />
  );
}

function getProviderHeroImage(categorySlug?: string | null) {
  return categorySlug ? PROVIDER_HERO_IMAGES[categorySlug] ?? PROVIDER_HERO_IMAGES.shoes : PROVIDER_HERO_IMAGES.shoes;
}

function getServiceImage(categorySlug?: string | null) {
  return categorySlug ? SERVICE_IMAGES[categorySlug] ?? SERVICE_IMAGES.shoes : SERVICE_IMAGES.shoes;
}

function getProviderInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "SI";
  if (words.length === 1) return words[0].slice(0, 2);
  return `${words[0][0]}${words[1][0]}`;
}

function formatDuration(minutes: number) {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  if (minutes >= 120) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours} hrs`;
  }
  if (minutes >= 60) {
    return "1 hr";
  }
  return `${minutes} mins`;
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    paddingBottom: 132,
    backgroundColor: "#FAF8F4",
  },
  heroWrap: {
    height: 380,
    marginBottom: -72,
    backgroundColor: "#0B1417",
  },
  heroImage: {
    flex: 1,
  },
  heroImageRadius: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroOverlay: {
    flex: 1,
    paddingTop: 54,
    paddingHorizontal: 20,
    backgroundColor: "rgba(8, 10, 8, 0.20)",
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroActions: {
    flexDirection: "row",
    gap: 14,
  },
  roundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    marginHorizontal: 18,
    borderRadius: 34,
    padding: 30,
    gap: 26,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  logoBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#D6A73D",
    textAlign: "center",
    lineHeight: 30,
  },
  providerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  providerTitle: {
    fontSize: 42,
    lineHeight: 48,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  verifiedPill: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  verifiedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricsCard: {
    minHeight: 132,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 34,
  },
  metricLabel: {
    textAlign: "center",
    maxWidth: 112,
  },
  metricDivider: {
    width: 1,
    height: 86,
  },
  servicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  serviceList: {
    gap: 14,
  },
  serviceRow: {
    minHeight: 146,
    borderRadius: 18,
    padding: 0,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingRight: 16,
  },
  serviceImage: {
    width: 156,
    height: 146,
    overflow: "hidden",
  },
  serviceImageRadius: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  serviceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  categoryPill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priceColumn: {
    width: 88,
    alignItems: "flex-end",
    gap: 14,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
