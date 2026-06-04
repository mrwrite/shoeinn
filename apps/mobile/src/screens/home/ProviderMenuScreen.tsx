import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { listServices } from "../../api/http";
import { ServiceCard } from "../../components/ServiceCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { filterServicesByCategory } from "../../discovery/categoryDiscovery";
import { getProviderCategoryLabel } from "../../discovery/categoryMetadata";
import { getPrimaryCategorySlug } from "../../discovery/marketplaceVisuals";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import type { Service } from "../../types/booking";

export default function ProviderMenuScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "ProviderMenu">>();
  const { company, categorySlug, categoryName } = route.params;
  const location = [company.city, company.state].filter(Boolean).join(", ") || "Serving your area";
  const categoryLabel = getProviderCategoryLabel(company);
  const primaryCategorySlug = categorySlug ?? getPrimaryCategorySlug(company.offered_categories);

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

  return (
    <AppScreen scrollable contentContainerStyle={styles.container}>
      <Card variant="marketplace" style={styles.heroCard}>
        <MediaPlaceholder
          categorySlug={primaryCategorySlug}
          label={company.name}
          caption={categoryName ? `${categoryName} care` : "Premium local care"}
          style={styles.heroMedia}
        />
        <View style={styles.heroContent}>
          <SectionHeader
            eyebrow="Care provider"
            title={company.name}
            subtitle={categoryName ? `${categoryName} services in ${location}` : location}
          />
          <View style={styles.badgeRow}>
            <StatusBadge label="Trusted local care" tone="primary" />
            <StatusBadge label={categoryLabel} tone="neutral" />
            <StatusBadge label={`${services.length || "Fresh"} services`} tone="warning" />
          </View>
        </View>
      </Card>

      <Card variant="compact" style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceElevated }]}>
        <View style={styles.summaryItem}>
          <Text variant="meta" weight="bold" color={theme.colors.textMuted}>
            Location
          </Text>
          <Text weight="bold">{location}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.divider }]} />
        <View style={styles.summaryItem}>
          <Text variant="meta" weight="bold" color={theme.colors.textMuted}>
            Viewing
          </Text>
          <Text weight="bold">{categoryName ?? "All care services"}</Text>
        </View>
      </Card>

      <SectionHeader
        eyebrow={categoryName ? "Filtered services" : "Service menu"}
        title="Choose your care service"
        subtitle={categoryName ? `Showing ${categoryName.toLowerCase()} options from this provider.` : "Transparent pricing and pickup-ready care."}
      />

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
        services.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            onPress={(service) => navigation.navigate("ServiceDetail", { service })}
            onBook={(service) => navigation.navigate("BookingDate", { service })}
          />
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    padding: 0,
    overflow: "hidden",
  },
  heroMedia: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroContent: {
    padding: 16,
    gap: 14,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    alignSelf: "stretch",
  },
});
