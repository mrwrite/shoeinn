import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { ImageBackground, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { getAppointmentAssignment, getMyAppointments, listCareCategories, listCompanies } from "../../api/http";
import { getDemoMarketDiscoveryLocation, shouldShowDemoLogins } from "../../auth/demoLogins";
import { ProviderCard } from "../../components/ProviderCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { CategoryTile } from "../../components/ui/CategoryTile";
import { Card, PressableCard } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { SearchBar } from "../../components/ui/SearchBar";
import { StatusBadge, AppointmentStatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { brandCopy } from "../../content/brandCopy";
import {
  filterCompaniesByCategory,
  getCategoryEmptyMessage,
  getCategoryIconName,
  getVisibleCategories,
} from "../../discovery/categoryDiscovery";
import { getMarketplaceVisual } from "../../discovery/marketplaceVisuals";
import { useCityState } from "../../hooks/useCityState";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { AppointmentSummary } from "../../types/booking";
import type { CareCategory } from "../../types/care";
import type { Company } from "../../types/company";

type FeaturedProvider = {
  id: string;
  name: string;
  rating: string;
  distance: string;
  categories: { slug: string; name: string }[];
};

const FEATURED_PROVIDERS: FeaturedProvider[] = [
  {
    id: "shoe-lounge",
    name: "The Shoe Lounge",
    rating: "4.9",
    distance: "0.4 mi",
    categories: [{ slug: "shoes", name: "Shoes" }],
  },
  {
    id: "pristine-cleaners",
    name: "Pristine Cleaners",
    rating: "4.8",
    distance: "0.7 mi",
    categories: [
      { slug: "dry-cleaning", name: "Dry Cleaning" },
      { slug: "laundry", name: "Laundry" },
    ],
  },
  {
    id: "luxe-leather",
    name: "Luxe Leather Co.",
    rating: "4.9",
    distance: "1.2 mi",
    categories: [{ slug: "handbags-leather", name: "Handbags & Leather" }],
  },
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80";
const PROVIDER_IMAGES: Record<string, string> = {
  shoes: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=80",
  laundry: "https://images.unsplash.com/photo-1542089363-7a1e6c5c1b1d?auto=format&fit=crop&w=1000&q=80",
  "dry-cleaning": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80",
  "handbags-leather": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=80",
  "rugs-textiles": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
  alterations: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
};
const APPOINTMENT_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80";

const DEMO_ACTIVE_APPOINTMENT: AppointmentSummary = {
  id: "demo-active-appointment",
  customer_name: "Anthony",
  customer_phone: "(555) 555-0101",
  service_id: "demo-service",
  service_name: "Sneaker Deep Clean",
  category_id: "shoes",
  category_slug: "shoes",
  category_name: "Shoes",
  category_icon_key: "footprints",
  start_time: "2025-05-24T10:00:00.000Z",
  status: "confirmed",
  payment_status: "succeeded",
  payment_mode: "service",
  payment_checkout_url: null,
  payment_message: null,
};

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const rootNavigation = navigation.getParent() as any;
  const fullName = useAuthStore((state) => state.fullName);
  const token = useAuthStore((state) => state.token);
  const [search, setSearch] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const { city, state, loading: locationLoading } = useCityState();
  const useDemoDiscoveryLocation = shouldShowDemoLogins();
  const demoDiscoveryLocation = useMemo(() => getDemoMarketDiscoveryLocation(), []);
  const discoveryCity = useDemoDiscoveryLocation ? demoDiscoveryLocation.city : city;
  const discoveryState = useDemoDiscoveryLocation ? demoDiscoveryLocation.state : state;
  const categoryTileWidth = Math.max(108, Math.floor((width - 16 * 2 - 24) / 3));

  const categoriesQuery = useQuery<CareCategory[]>({
    queryKey: ["care-categories"],
    queryFn: listCareCategories,
    staleTime: 1000 * 60 * 15,
  });

  const categories = useMemo(() => getVisibleCategories(categoriesQuery.data), [categoriesQuery.data]);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === selectedCategorySlug) ?? null,
    [categories, selectedCategorySlug],
  );
  const selectedCategoryLabel = selectedCategory?.name ?? "All care";

  const companiesQuery = useQuery<Company[]>({
    queryKey: ["companies", discoveryCity, discoveryState, search, selectedCategorySlug],
    queryFn: () =>
      listCompanies({
        city: discoveryCity,
        state: discoveryState,
        query: search || undefined,
        categorySlug: selectedCategorySlug,
      }),
  });

  const companies = companiesQuery.data ?? [];
  const filteredCompanies = useMemo(() => {
    const categoryFiltered = filterCompaniesByCategory(companies, selectedCategorySlug);
    if (!search) return categoryFiltered;
    const term = search.toLowerCase();
    return categoryFiltered.filter((company) =>
      [company.name, company.city ?? "", company.state ?? ""].some((field) => field.toLowerCase().includes(term)),
    );
  }, [companies, search, selectedCategorySlug]);

  const featuredProviders = useMemo(
    () =>
      FEATURED_PROVIDERS.filter((provider) =>
        selectedCategorySlug ? provider.categories.some((category) => category.slug === selectedCategorySlug) : true,
      ).filter((provider) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return [provider.name, provider.distance, ...provider.categories.map((category) => category.name)]
          .join(" ")
          .toLowerCase()
          .includes(term);
      }),
    [search, selectedCategorySlug],
  );

  const myAppointmentsQuery = useQuery<AppointmentSummary[]>({
    queryKey: ["my-appointments", token],
    queryFn: getMyAppointments,
    enabled: Boolean(token),
    staleTime: 1000 * 15,
  });

  const activeAppointment = useMemo(
    () =>
      myAppointmentsQuery.data?.find((appointment) => !["completed", "cancelled"].includes(appointment.status)) ??
      myAppointmentsQuery.data?.[0] ??
      DEMO_ACTIVE_APPOINTMENT,
    [myAppointmentsQuery.data],
  );

  const activeAppointmentAssignmentQuery = useQuery({
    queryKey: ["appointment-assignment", activeAppointment?.id],
    queryFn: () => getAppointmentAssignment(activeAppointment!.id),
    enabled: Boolean(token && activeAppointment?.id),
    staleTime: 1000 * 30,
  });

  const activeProviderName = activeAppointmentAssignmentQuery.data?.provider_name ?? "Assigned provider";
  const activeAppointmentLabel = activeAppointment.category_name ?? "Care appointment";
  const locationLabel = useDemoDiscoveryLocation
    ? demoDiscoveryLocation.label
    : city || state
      ? [city, state].filter(Boolean).join(", ")
      : "Nearby";
  const providerCountLabel = companiesQuery.isLoading ? "Finding providers" : `${filteredCompanies.length} local teams`;
  const firstName = (fullName?.trim().split(/\s+/)[0] || "Anthony").replace(/[^A-Za-z'-]/g, "") || "Anthony";
  const heroProvider = filteredCompanies[0] ?? companies[0];

  const navigateToFirstProvider = () => {
    if (!heroProvider) return;
    navigation.navigate("ProviderMenu", {
      company: heroProvider,
      categorySlug: selectedCategorySlug,
      categoryName: selectedCategory?.name ?? null,
    });
  };

  const openNotifications = () => {
    rootNavigation?.navigate("AppointmentsTab", {
      screen: "CustomerNotifications",
    });
  };

  const openHelp = () => {
    rootNavigation?.navigate("ProfileTab");
  };

  const openActiveAppointment = () => {
    if (!activeAppointment?.id) return;
    rootNavigation?.navigate("AppointmentsTab", {
      screen: "AppointmentDetail",
      params: { appointmentId: activeAppointment.id, summary: activeAppointment },
    });
  };

  return (
    <AppScreen scrollable contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandLockup}>
          <View style={styles.brandWordmarkWrap}>
            <View style={styles.brandWordmarkRow}>
              <Text variant="display" weight="bold" style={[styles.brandWordmark, { color: theme.colors.primary }]}>
                {brandCopy.appName}
              </Text>
              <Ionicons name="star" size={11} color={theme.colors.accent} />
            </View>
            <Text variant="caption" weight="bold" color={theme.colors.accentPressed} style={styles.brandTagline}>
              PREMIUM CARE MARKETPLACE
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="chatbubble-ellipses-outline"
            label="Open help and support"
            onPress={openHelp}
          />
          <IconButton icon="notifications-outline" label="Open notifications" onPress={openNotifications} />
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <Text variant="overline" weight="bold" color={theme.colors.accentPressed}>
          {locationLabel}
        </Text>
        <Text variant="h1" weight="bold">
          Good Morning, {firstName}
        </Text>
      </View>

      <Card variant="marketplace" style={[styles.heroCard, theme.shadows.floating]}>
        <ImageBackground
          source={{ uri: HERO_IMAGE }}
          resizeMode="cover"
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
          onError={() => undefined}
        >
          <View style={styles.heroShade}>
            <LinearGradient
              colors={["rgba(12,18,20,0.84)", "rgba(12,18,20,0.38)", "rgba(12,18,20,0.08)"]}
              locations={[0, 0.62, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroPill, { backgroundColor: "rgba(255,255,255,0.14)" }]}>
                <Ionicons name="location" size={15} color={theme.colors.surfaceElevated} />
                <Text variant="caption" weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                  {!useDemoDiscoveryLocation && locationLoading ? "Locating..." : locationLabel}
                </Text>
              </View>
              <StatusBadge label={selectedCategoryLabel} tone={selectedCategory ? "primary" : "neutral"} />
            </View>
            <View style={styles.heroBody}>
              <View style={styles.heroCopy}>
                <Text variant="h1" weight="bold" style={styles.heroTitle}>
                  What needs care today?
                </Text>
                <Text color="rgba(255,255,255,0.82)" style={styles.heroSubtitle}>
                  Exceptional care. Trusted experts.
                </Text>
                <Button
                  label="Book a Service"
                  variant="primary"
                  rightIcon={<Ionicons name="chevron-forward" size={16} color={theme.colors.surfaceElevated} />}
                  onPress={navigateToFirstProvider}
                  disabled={!heroProvider}
                  style={styles.heroButton}
                />
              </View>
              <View style={styles.heroStatsStack}>
                <View style={[styles.heroStat, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
                  <Text variant="meta" weight="bold" style={{ color: "rgba(255,255,255,0.70)" }}>
                    Category
                  </Text>
                  <Text weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                    {selectedCategoryLabel}
                  </Text>
                </View>
                <View style={[styles.heroStat, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
                  <Text variant="meta" weight="bold" style={{ color: "rgba(255,255,255,0.70)" }}>
                    Nearby
                  </Text>
                  <Text weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                    {providerCountLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Card>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search providers and services"
            accessibilityLabel="Search providers and services"
          />
        </View>
        <IconButton
          icon="options-outline"
          label="Filter care categories"
          onPress={() => setSelectedCategorySlug((current) => (current ? null : categories[0]?.slug ?? null))}
        />
      </View>

      {categories.length > 0 ? (
        <View style={styles.categorySection}>
          <SectionHeader
            eyebrow="Care categories"
            title="What needs care today?"
            subtitle="Choose a category or browse every trusted local care team."
          />
          <View style={styles.categoryGrid}>
            <CategoryTile
              categorySlug={null}
              label="All care"
              iconName="apps-outline"
              selected={selectedCategorySlug === null}
              onPress={() => setSelectedCategorySlug(null)}
              style={[styles.categoryTile, { width: categoryTileWidth }]}
            />
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                categorySlug={category.slug}
                label={category.name}
                iconName={getCategoryIconName(category.icon_key) as keyof typeof Ionicons.glyphMap}
                selected={selectedCategorySlug === category.slug}
                onPress={() =>
                  setSelectedCategorySlug((current) => (current === category.slug ? null : category.slug))
                }
                style={[styles.categoryTile, { width: categoryTileWidth }]}
              />
            ))}
          </View>
        </View>
      ) : categoriesQuery.isLoading ? (
        <LoadingState label="Loading care categories" />
      ) : null}

      <View style={styles.sectionStack}>
        <SectionHeader
          eyebrow="Featured teams"
          title="Trusted local providers"
          subtitle="Luxury pickup care, laundry, and specialty care from vetted local teams."
          action={
            <Button
              label="View all"
              variant="ghost"
              size="compact"
              onPress={() => {
                setSearch("");
                setSelectedCategorySlug(null);
              }}
            />
          }
        />
        {featuredProviders.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerRail}>
            {featuredProviders.map((provider) => (
              <FeaturedProviderCard key={provider.id} provider={provider} />
            ))}
          </ScrollView>
        ) : (
          <EmptyState
            title="No featured providers match"
            message={getCategoryEmptyMessage(selectedCategory)}
            icon="search-outline"
            style={styles.sectionEmpty}
          />
        )}
      </View>

      <View style={styles.sectionStack}>
        <SectionHeader
          eyebrow="Current booking"
          title="Active appointment"
          subtitle="Track your current pickup, care progress, and delivery in one place."
        />
        {activeAppointment ? (
          <ActiveAppointmentCard
            appointment={activeAppointment}
            providerName={activeProviderName}
            onPress={openActiveAppointment}
          />
        ) : (
          <EmptyState
            title="No active appointments"
            message="When you book a service, it will appear here with status updates and tracking."
            icon="calendar-outline"
            actionLabel="Book a service"
            onAction={navigateToFirstProvider}
          />
        )}
      </View>

      <View style={styles.sectionStack}>
        <SectionHeader
          eyebrow={selectedCategory ? selectedCategory.name : "Nearby care"}
          title="Browse local care teams"
          subtitle={`${providerCountLabel} for pickup, delivery, and premium care.`}
        />

        {companiesQuery.isLoading ? (
          <LoadingState label="Loading local providers" />
        ) : companiesQuery.isError ? (
          <EmptyState
            title="Unable to load providers"
            message="Check your connection and try again."
            icon="cloud-offline-outline"
            actionLabel="Retry"
            onAction={() => companiesQuery.refetch()}
          />
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            title="No providers found"
            message={getCategoryEmptyMessage(selectedCategory)}
            icon="search-outline"
          />
        ) : (
          filteredCompanies.slice(0, 3).map((company) => (
            <ProviderCard
              key={company.id}
              company={company}
              onPress={(selected) =>
                navigation.navigate("ProviderMenu", {
                  company: selected,
                  categorySlug: selectedCategorySlug,
                  categoryName: selectedCategory?.name ?? null,
                })
              }
            />
          ))
        )}
      </View>

      <View style={{ height: 36 }} />
    </AppScreen>
  );
}

function IconButton({
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSoft },
        theme.shadows.soft,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
    </Pressable>
  );
}

function FeaturedProviderCard({ provider }: { provider: FeaturedProvider }) {
  const theme = useTheme();
  const visual = getMarketplaceVisual(provider.categories[0]?.slug);
  const imageUrl = PROVIDER_IMAGES[provider.categories[0]?.slug ?? ""] ?? PROVIDER_IMAGES.shoes;
  return (
    <PressableCard
      variant="marketplace"
      accessibilityRole="button"
      accessibilityLabel={`Open provider ${provider.name}`}
      style={styles.featuredCard}
    >
      <ImageFrame source={imageUrl} categorySlug={provider.categories[0]?.slug} style={styles.featuredMedia} />
      <View style={styles.featuredContent}>
        <View style={styles.featuredTitleRow}>
          <View style={{ flex: 1 }}>
            <Text variant="h3" weight="bold" numberOfLines={2}>
              {provider.name}
            </Text>
            <View style={styles.featuredMetaRow}>
              <StatusBadge label={`★ ${provider.rating}`} tone="success" />
              <StatusBadge label={provider.distance} tone="neutral" />
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Save ${provider.name}`} style={styles.heartButton}>
            <Ionicons name="heart-outline" size={18} color={theme.colors.surfaceElevated} />
          </Pressable>
        </View>
        <View style={styles.featuredCategories}>
          {provider.categories.map((category) => (
            <View key={category.slug} style={[styles.featuredPill, { backgroundColor: visual.softColor }]}>
              <Text variant="caption" weight="bold" color={theme.colors.textSecondary}>
                {category.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </PressableCard>
  );
}

function ActiveAppointmentCard({
  appointment,
  providerName,
  onPress,
}: {
  appointment: AppointmentSummary;
  providerName: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const when = new Date(appointment.start_time);
  const imageUrl = APPOINTMENT_IMAGE;
  return (
    <PressableCard
      variant="marketplace"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open active appointment for ${appointment.service_name ?? "service"}`}
      style={styles.activeAppointmentCard}
    >
      <View style={styles.activeHeader}>
        <View style={styles.activeThumbWrap}>
          <ImageFrame source={imageUrl} categorySlug={appointment.category_slug} style={styles.activeThumb} compact />
          <View style={[styles.dateBlock, { backgroundColor: theme.colors.surfaceElevated }, theme.shadows.card]}>
            <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
              {when.toLocaleDateString(undefined, { weekday: "short" })}
            </Text>
            <Text variant="h3" weight="bold">
              {when.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>
        <AppointmentStatusBadge status={appointment.status} />
      </View>
      <View style={styles.activeContent}>
        <View style={{ flex: 1 }}>
          <Text variant="h3" weight="bold">
            {appointment.service_name ?? "Appointment"}
          </Text>
          <Text color={theme.colors.textSecondary} style={styles.activeSubcopy}>
            {providerName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>
      <View style={styles.activeMetaRow}>
        {appointment.category_name ? <StatusBadge label={appointment.category_name} tone="primary" /> : null}
        {appointment.payment_status ? (
          <StatusBadge
            label={
              appointment.payment_status === "succeeded"
                ? "Paid"
                : appointment.payment_status === "pending"
                  ? "Payment pending"
                  : appointment.payment_status === "failed"
                    ? "Payment failed"
                    : "Payment"
            }
            tone={
              appointment.payment_status === "succeeded"
                ? "success"
                : appointment.payment_status === "failed"
                  ? "danger"
                  : "warning"
            }
          />
        ) : null}
      </View>
      <View style={[styles.activeInfoPanel, { backgroundColor: theme.colors.surfaceMuted }]}>
        <InfoRow icon="calendar-outline" label="When" value={when.toLocaleString()} />
        <InfoRow icon="storefront-outline" label="Provider" value={providerName} />
        <InfoRow
          icon="location-outline"
          label="Location"
          value={[appointment.address_line1, appointment.city, appointment.state].filter(Boolean).join(", ") || "Pickup scheduled"}
        />
      </View>
      <Button label="View booking" variant="secondary" onPress={onPress} style={styles.activeButton} />
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
        <Text weight="bold" numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greetingBlock: {
    gap: 6,
  },
  heroCard: {
    borderRadius: 34,
    overflow: "hidden",
  },
  heroBackground: {
    minHeight: 330,
  },
  heroBackgroundImage: {
    borderRadius: 34,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  heroBody: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-end",
  },
  heroCopy: {
    flex: 1.15,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroPill: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "72%",
  },
  heroTitle: {
    color: "#FFFFFF",
    maxWidth: 220,
    fontFamily: Platform.select({ ios: "Times New Roman", android: "serif" }),
  },
  heroSubtitle: {
    flex: 1,
    maxWidth: 250,
  },
  heroStat: {
    minHeight: 62,
    borderRadius: 18,
    padding: 12,
    gap: 2,
  },
  heroButton: {
    minWidth: 180,
    alignSelf: "flex-start",
    borderRadius: 18,
  },
  heroStatsStack: {
    width: 116,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchContainer: {
    flex: 1,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categorySection: {
    gap: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryTile: {
    flexGrow: 1,
  },
  sectionStack: {
    gap: 12,
  },
  providerRail: {
    gap: 12,
    paddingRight: 8,
  },
  featuredCard: {
    width: 222,
    padding: 0,
    overflow: "hidden",
  },
  featuredMedia: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    minHeight: 158,
  },
  featuredContent: {
    padding: 14,
    gap: 12,
  },
  featuredTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featuredMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  heartButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  featuredCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featuredPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionEmpty: {
    marginTop: 2,
  },
  activeAppointmentCard: {
    padding: 0,
    overflow: "hidden",
    gap: 14,
  },
  activeHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  activeThumbWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  activeThumb: {
    flex: 1,
    minHeight: 112,
  },
  dateBlock: {
    width: 96,
    minHeight: 112,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
  },
  activeContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
  },
  activeSubcopy: {
    marginTop: 4,
  },
  activeMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  activeInfoPanel: {
    borderRadius: 22,
    padding: 12,
    gap: 10,
    marginHorizontal: 16,
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
  activeButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  brandWordmarkWrap: {
    gap: 2,
  },
  brandWordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandWordmark: {
    fontFamily: Platform.select({ ios: "Times New Roman", android: "serif" }),
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  brandTagline: {
    letterSpacing: 1.5,
  },
  imageFrame: {
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  imageFrameLarge: {
    minHeight: 150,
    borderRadius: 28,
  },
  imageFrameCompact: {
    minHeight: 112,
    borderRadius: 22,
  },
  imageFrameImage: {
    borderRadius: 28,
  },
});

function ImageFrame({
  source,
  categorySlug,
  compact,
  style,
}: {
  source: string;
  categorySlug?: string | null;
  compact?: boolean;
  style?: any;
}) {
  const theme = useTheme();
  const [error, setError] = useState(false);
  if (error) {
    return (
      <MediaPlaceholder
        compact={compact}
        categorySlug={categorySlug}
        label={categorySlug ? undefined : "Premium care"}
        caption="Trusted local care"
        style={style}
      />
    );
  }

  return (
    <ImageBackground
      source={{ uri: source }}
      resizeMode="cover"
      style={[
        styles.imageFrame,
        compact ? styles.imageFrameCompact : styles.imageFrameLarge,
        { backgroundColor: theme.colors.surfaceMuted },
        style,
      ]}
      imageStyle={[styles.imageFrameImage, compact ? styles.imageFrameCompact : styles.imageFrameLarge]}
      onError={() => setError(true)}
    >
      <LinearGradient
        colors={["rgba(14,18,20,0.10)", "rgba(14,18,20,0.42)"]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
    </ImageBackground>
  );
}
