import React from "react";
import { ImageBackground, RefreshControl, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { claimAppointment, fetchMyAppointments, fetchOpenAppointments } from "../../api/http";
import { AppointmentCard } from "../../components/AppointmentCard";
import { AppCard } from "../../components/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { StatusBadge } from "../../components/StatusBadge";
import { Text } from "../../components/ui/Text";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import { formatOperationalCue, getClaimFeedback, type FeedbackState } from "../../features/providerAdminCopy";
import type { ProviderStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { ProviderAppointment } from "../../types/company";

type TabKey = "available" | "my";

function getTopCategories(openAppointments: ProviderAppointment[] | undefined, myAppointments: ProviderAppointment[] | undefined) {
  const categories = new Map<string, string>();
  [...(openAppointments ?? []), ...(myAppointments ?? [])].forEach((appointment) => {
    if (appointment.category_name) {
      categories.set(appointment.category_name, appointment.category_slug ?? appointment.category_name);
    }
  });
  return Array.from(categories.entries()).slice(0, 3);
}

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1400&q=80";

export default function ProviderDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<TabKey>("available");
  const [feedback, setFeedback] = React.useState<FeedbackState>(null);
  const [claimingAppointmentId, setClaimingAppointmentId] = React.useState<string | null>(null);
  const fullName = useAuthStore((state) => state.fullName);

  const openAppointmentsQuery = useQuery({
    queryKey: ["provider", "open"],
    queryFn: fetchOpenAppointments,
  });

  const myAppointmentsQuery = useQuery({
    queryKey: ["provider", "my"],
    queryFn: fetchMyAppointments,
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => claimAppointment(id),
    onSuccess: () => {
      setClaimingAppointmentId(null);
      setFeedback({ tone: "success", message: "Job claimed. It now appears in My Jobs." });
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
      queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      void openAppointmentsQuery.refetch();
      void myAppointmentsQuery.refetch();
    },
    onError: (err: Error) => {
      setClaimingAppointmentId(null);
      setFeedback(getClaimFeedback(err));
    },
  });

  React.useEffect(() => {
    setFeedback(null);
  }, [activeTab]);

  useFocusedAutoRefresh({
    enabled: true,
    intervalMs: 25000,
    onRefresh: () => {
      void openAppointmentsQuery.refetch();
      void myAppointmentsQuery.refetch();
    },
  });

  const activeQuery = activeTab === "available" ? openAppointmentsQuery : myAppointmentsQuery;
  const availableCount = openAppointmentsQuery.data?.length ?? 0;
  const myCount = myAppointmentsQuery.data?.length ?? 0;
  const dashboardCue = formatOperationalCue(activeTab === "available" ? openAppointmentsQuery.data : myAppointmentsQuery.data, activeTab);
  const categories = getTopCategories(openAppointmentsQuery.data, myAppointmentsQuery.data);
  const greetingName = fullName?.split(" ")[0] ?? "there";

  const title = activeTab === "available" ? "Available jobs" : "My jobs";
  const subtitle = activeTab === "available" ? "Claimable work that still needs a provider." : "Jobs currently assigned to you.";

  const refreshControl = (
    <RefreshControl
      refreshing={activeQuery.isRefetching}
      tintColor={theme.colors.primary}
      onRefresh={() => {
        void openAppointmentsQuery.refetch();
        void myAppointmentsQuery.refetch();
      }}
    />
  );

  return (
    <AppScreen scrollable refreshControl={refreshControl} contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandLockup}>
          <View style={styles.brandWordmarkWrap}>
            <View style={styles.brandWordmarkRow}>
              <Text variant="display" weight="bold" style={[styles.brandWordmark, { color: theme.colors.primary }]}>
                ShoeInn
              </Text>
              <Ionicons name="star" size={11} color={theme.colors.accent} />
            </View>
            <Text variant="caption" weight="bold" color={theme.colors.accentPressed} style={styles.brandTagline}>
              PROVIDER DISPATCH
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <Text variant="overline" weight="bold" color={theme.colors.accentPressed}>
          Dispatch board
        </Text>
        <Text variant="h1" weight="bold">
          Good Morning, {greetingName}
        </Text>
      </View>

      <AppCard variant="marketplace" style={[styles.heroCard, theme.shadows.floating]}>
        <ImageBackground source={{ uri: HERO_IMAGE }} resizeMode="cover" style={styles.heroBackground} imageStyle={styles.heroBackgroundImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroPill, { backgroundColor: "rgba(255,255,255,0.14)" }]}>
                <Ionicons name="location" size={15} color={theme.colors.surfaceElevated} />
                <Text variant="caption" weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                  {activeTab === "available" ? "Open board" : "Active queue"}
                </Text>
              </View>
              <StatusBadge label={activeTab === "available" ? "Open board" : "Active queue"} tone="primary" />
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroCopy}>
                <Text variant="h1" weight="bold" style={styles.heroTitle}>
                  What needs attention today?
                </Text>
                <Text color="rgba(255,255,255,0.82)" style={styles.heroSubtitle}>
                  {dashboardCue}
                </Text>
                <Button
                  label="Refresh board"
                  variant="primary"
                  leftIcon={<Ionicons name="refresh-outline" size={16} color={theme.colors.surfaceElevated} />}
                  onPress={() => {
                    void openAppointmentsQuery.refetch();
                    void myAppointmentsQuery.refetch();
                  }}
                  style={styles.heroButton}
                />
              </View>
              <View style={styles.heroStatsStack}>
                <View style={[styles.heroStat, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
                  <Text variant="meta" weight="bold" style={{ color: "rgba(255,255,255,0.70)" }}>
                    Available
                  </Text>
                  <Text weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                    {availableCount}
                  </Text>
                </View>
                <View style={[styles.heroStat, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
                  <Text variant="meta" weight="bold" style={{ color: "rgba(255,255,255,0.70)" }}>
                    My jobs
                  </Text>
                  <Text weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                    {myCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </AppCard>

      <View style={styles.tabs}>
        <Button
          label={`Available (${availableCount})`}
          variant={activeTab === "available" ? "primary" : "secondary"}
          onPress={() => setActiveTab("available")}
          style={styles.tabButton}
        />
        <Button
          label={`My Jobs (${myCount})`}
          variant={activeTab === "my" ? "primary" : "secondary"}
          onPress={() => setActiveTab("my")}
          style={styles.tabButton}
        />
      </View>

      <AppCard variant="marketplace" style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" weight="bold" color={theme.colors.accentPressed}>
              Dispatch overview
            </Text>
            <Text variant="h3" weight="bold" style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <Text color={theme.colors.textSecondary} style={styles.summarySubtitle}>
              {subtitle}
            </Text>
          </View>
          <StatusBadge label={activeTab === "available" ? "Open board" : "Active queue"} tone="primary" />
        </View>

        <View style={styles.metricRow}>
          <Metric label="Available" value={`${availableCount}`} tone="success" />
          <Metric label="My jobs" value={`${myCount}`} tone="primary" />
        </View>

        {categories.length > 0 ? (
          <View style={styles.categoryRow}>
            {categories.map(([label, slug]) => (
              <StatusBadge key={slug} label={label} tone="neutral" />
            ))}
          </View>
        ) : null}
      </AppCard>

      {feedback ? (
        <View
          style={[
            styles.feedback,
            {
              backgroundColor:
                feedback.tone === "success" ? `${theme.colors.success}12` : feedback.tone === "warning" ? `${theme.colors.warning}14` : `${theme.colors.danger}12`,
              borderColor:
                feedback.tone === "success" ? `${theme.colors.success}33` : feedback.tone === "warning" ? `${theme.colors.warning}33` : `${theme.colors.danger}33`,
            },
          ]}
        >
          <Text weight="bold" color={feedback.tone === "danger" ? theme.colors.danger : theme.colors.textPrimary}>
            {feedback.message}
          </Text>
        </View>
      ) : null}

      {activeQuery.isLoading ? (
        <LoadingState label={activeTab === "available" ? "Loading available jobs" : "Loading your active jobs"} />
      ) : activeQuery.isError ? (
        <View style={styles.stateWrap}>
          <EmptyState
            title={activeTab === "available" ? "Job board unavailable" : "Queue unavailable"}
            message="Refresh to pull the latest dispatch state."
            icon="cloud-offline-outline"
          />
          <Button label="Retry" variant="secondary" onPress={() => activeQuery.refetch()} style={styles.retryButton} />
        </View>
      ) : activeQuery.data?.length ? (
        <View style={styles.list}>
          {activeQuery.data.map((item) => (
            <AppointmentCard
              key={item.id}
              appointment={{
                id: item.id,
                customer_name: item.customer_name ?? "Customer",
                customer_phone: item.customer_phone ?? "",
                address_line1: item.address_line1 ?? null,
                address_line2: item.address_line2 ?? null,
                city: item.city ?? item.customer_city ?? null,
                state: item.state ?? item.customer_state ?? null,
                postal_code: item.postal_code ?? null,
                company_id: undefined,
                service_id: item.service_id,
                service_name: item.service_name,
                category_id: item.category_id,
                category_slug: item.category_slug,
                category_name: item.category_name,
                category_icon_key: item.category_icon_key,
                start_time: item.start_time,
                status: item.status,
              }}
              onPress={() => navigation.navigate("ProviderAppointmentDetail", { appointment: item })}
              onClaim={
                activeTab === "available"
                  ? () => {
                      if (claimMutation.isPending) {
                        return;
                      }
                      setClaimingAppointmentId(item.id);
                      claimMutation.mutate(item.id);
                    }
                  : undefined
              }
              claimable={activeTab === "available"}
              claimDisabled={claimMutation.isPending}
              claimLoading={claimMutation.isPending && claimingAppointmentId === item.id}
              helperText={
                activeTab === "available"
                  ? "Review the route and pickup window, then claim when this job works for you."
                  : "Open this job for the current next step, route, and status actions."
              }
              actionLabel={activeTab === "available" ? "Available to claim" : "Assigned to you"}
              emphasis={activeTab === "available" ? "actionable" : "owned"}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title={activeTab === "available" ? "No available jobs" : "No claimed jobs"}
          message={
            activeTab === "available"
              ? "Nothing needs a provider right now. Pull to refresh or check back for the next pickup window."
              : "Your queue is clear. Claim a job from Available Jobs and it will appear here."
          }
          icon={activeTab === "available" ? "briefcase-outline" : "checkmark-done-outline"}
          actionLabel={activeTab === "available" ? "Refresh board" : undefined}
          onAction={activeTab === "available" ? () => activeQuery.refetch() : undefined}
        />
      )}
    </AppScreen>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "primary" | "success" }) {
  const theme = useTheme();
  const color = tone === "success" ? theme.colors.success : theme.colors.accent;
  return (
    <View style={[styles.metricCard, { backgroundColor: `${color}14`, borderColor: `${color}2E` }]}>
      <Text variant="caption" weight="bold" color={color}>
        {label}
      </Text>
      <Text variant="h2" weight="bold" color={color} style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  brandTagline: {
    letterSpacing: 1.5,
  },
  greetingBlock: {
    gap: 6,
  },
  heroCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 34,
  },
  heroBackground: {
    minHeight: 260,
  },
  heroBackgroundImage: {
    borderRadius: 34,
  },
  heroOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
    backgroundColor: "rgba(11, 20, 23, 0.20)",
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
  heroBody: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-end",
  },
  heroCopy: {
    flex: 1,
    gap: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    maxWidth: 220,
    fontSize: 34,
    lineHeight: 38,
  },
  heroSubtitle: {
    maxWidth: 260,
  },
  heroButton: {
    minWidth: 170,
    alignSelf: "flex-start",
    borderRadius: 18,
  },
  heroStatsStack: {
    width: 116,
    gap: 10,
  },
  heroStat: {
    minHeight: 62,
    borderRadius: 18,
    padding: 12,
    gap: 2,
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
  },
  tabButton: {
    flex: 1,
  },
  summaryCard: {
    gap: 14,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryTitle: {
    marginTop: 4,
  },
  summarySubtitle: {
    marginTop: 6,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
  },
  metricValue: {
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  feedback: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  stateWrap: {
    justifyContent: "center",
    gap: 12,
  },
  retryButton: {
    alignSelf: "stretch",
  },
  list: {
    gap: 12,
  },
});
