import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { fetchOpenAppointments, getCompany, listCompanyUsers } from "../../api/http";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { OwnerJobCard } from "../../components/OwnerJobCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { getEmphasis, getFilteredAppointments, getNextActionLabel } from "../../features/providerAdminCopy";
import type { ProviderStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { CompanyUser } from "../../types/company";

type FilterKey = "unassigned" | "in_progress" | "ready" | "all";

const IN_PROGRESS_STATUSES = new Set(["en_route_pickup", "picked_up", "cleaning", "out_for_delivery"]);

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export default function OwnerDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const companyId = useAuthStore((state) => state.companyId);
  const fullName = useAuthStore((state) => state.fullName);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("unassigned");

  const companyQuery = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompany(companyId ?? ""),
    enabled: !!companyId,
  });
  const jobsQuery = useQuery({
    queryKey: ["provider", "open"],
    queryFn: fetchOpenAppointments,
  });
  const teamQuery = useQuery({
    queryKey: ["company", "users"],
    queryFn: listCompanyUsers,
  });

  const jobs = useMemo(
    () => [...(jobsQuery.data ?? [])].sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime()),
    [jobsQuery.data],
  );
  const todaysJobs = jobs.filter((item) => isToday(item.start_time));
  const unassigned = jobs.filter((item) => !item.provider_name && item.status === "confirmed");
  const inProgress = jobs.filter((item) => IN_PROGRESS_STATUSES.has(item.status));
  const completed = jobs.filter((item) => item.status === "completed" || item.status === "delivered");
  const filteredJobs = getFilteredAppointments(jobs, selectedFilter);
  const topCategories = useMemo(
    () =>
      Array.from(
        new Map(
          jobs
            .filter((item) => item.category_name)
            .map((item) => [item.category_name as string, item.category_slug ?? item.category_name ?? "Care"] as const),
        ).entries(),
      ).slice(0, 4),
    [jobs],
  );

  const teamSnapshot = useMemo(() => {
    const providers = (teamQuery.data ?? []).filter((user) => user.role === "provider");
    return providers.map((provider) => {
      const activeCount = jobs.filter((job) => job.assigned_user_id === provider.id && !["completed", "cancelled", "delivered"].includes(job.status)).length;
      const readyCount = jobs.filter((job) => job.assigned_user_id === provider.id && job.status === "ready").length;
      return { provider, activeCount, readyCount };
    });
  }, [jobs, teamQuery.data]);

  const greetingName = fullName?.split(" ")[0] ?? "Owner";
  const refreshing = jobsQuery.isRefetching || teamQuery.isRefetching || companyQuery.isRefetching;
  const boardCue = unassigned.length > 0 ? `${unassigned.length} jobs need assignment.` : "The board is covered and the team can focus on progress and delivery.";
  const companyName = companyQuery.data?.name ?? "Your shop";

  return (
    <AppScreen
      scrollable
      style={{ backgroundColor: "#062E37" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={theme.colors.accent}
          onRefresh={() => {
            void jobsQuery.refetch();
            void teamQuery.refetch();
            void companyQuery.refetch();
          }}
        />
      }
      contentContainerStyle={styles.content}
    >
      {jobsQuery.isLoading || teamQuery.isLoading ? (
        <LoadingState label="Loading today's operation snapshot" />
      ) : jobsQuery.isError || teamQuery.isError ? (
        <View style={styles.stateWrap}>
          <EmptyState
            title="Owner dashboard unavailable"
            message="Pull to refresh after checking the local API and demo seed state."
            icon="cloud-offline-outline"
          />
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View style={styles.topBar}>
            <IconButton icon="menu-outline" />
            <View style={styles.topBarRight}>
              <IconButton icon="notifications-outline" />
              <View style={styles.avatar}>
                <Text weight="bold" style={{ color: theme.colors.accent, fontSize: 16 }}>
                  {greetingName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerBlock}>
            <Text variant="overline" weight="bold" color={theme.colors.accent}>
              OWNER COMMAND CENTER
            </Text>
            <View style={styles.titleRow}>
              <Text variant="h1" weight="bold" style={styles.companyTitle}>
                {companyName}
              </Text>
              <Ionicons name="shield-checkmark" size={22} color={theme.colors.accent} />
            </View>
            <Text style={styles.greetingCopy}>Good morning, {greetingName}. Here's today's pickup-and-delivery picture.</Text>
          </View>

          <View style={styles.datePillRow}>
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.accent} />
              <Text weight="semibold" style={styles.datePillText}>
                Today, Jun 4
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.surfaceElevated} />
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard label="Today" value={`${todaysJobs.length}`} detail="Jobs on today's board" tone="neutral" />
            <SummaryCard label="Unassigned" value={`${unassigned.length}`} detail="Need attention" tone={unassigned.length > 0 ? "priority" : "neutral"} />
            <SummaryCard label="Active" value={`${inProgress.length}`} detail="Currently moving" tone="active" />
            <SummaryCard label="Complete" value={`${completed.length}`} detail="Delivered or done" tone="ready" />
          </View>

          <Card variant="outline" style={styles.attentionCard}>
            <View style={styles.attentionTop}>
              <View style={styles.alertIcon}>
                <Ionicons name={unassigned.length > 0 ? "alert-circle-outline" : "checkmark-circle-outline"} size={24} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3" weight="bold" style={{ color: theme.colors.surfaceElevated }}>
                  {unassigned.length > 0
                    ? unassigned.length === 1
                      ? "1 job needs assignment"
                      : `${unassigned.length} jobs need assignments`
                    : "No unassigned jobs right now"}
                </Text>
                <Text style={styles.attentionCopy}>{boardCue}</Text>
              </View>
              <Button label={unassigned.length > 0 ? "Action needed" : "Covered"} variant="gold" size="compact" onPress={() => undefined} />
            </View>
            {topCategories.length > 0 ? (
              <View style={styles.categoryRow}>
                {topCategories.map(([label, slug]) => (
                  <StatusBadge key={slug} label={label} tone="neutral" />
                ))}
              </View>
            ) : null}
          </Card>

          <View style={styles.sectionHeaderRow}>
            <SectionHeader
              tone="dark"
              title="Jobs board"
              subtitle="Filter the board the way a cleaner owner would think about the day."
              style={{ flex: 1 }}
            />
            <View style={styles.iconCluster}>
              <IconButton icon="search-outline" />
              <IconButton icon="options-outline" />
            </View>
          </View>

          <View style={styles.filterRow}>
            {(
              [
                { key: "unassigned", label: "Unassigned" },
                { key: "in_progress", label: "In Progress" },
                { key: "ready", label: "Ready" },
                { key: "all", label: "All" },
              ] as const
            ).map((option) => {
              const active = selectedFilter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedFilter(option.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter owner jobs by ${option.label}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? "rgba(214, 166, 61, 0.16)" : "rgba(255,255,255,0.04)",
                      borderColor: active ? theme.colors.accent : "rgba(255,255,255,0.12)",
                    },
                  ]}
                >
                  <Text variant="caption" weight="bold" color={active ? theme.colors.accent : "rgba(255,255,255,0.76)"}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.jobList}>
            {filteredJobs.length === 0 ? (
              <EmptyState
                title="Nothing in this segment"
                message="Switch filters or pull to refresh after reseeding the local demo data."
                icon="briefcase-outline"
              />
            ) : (
              filteredJobs.map((appointment) => (
                <OwnerJobCard
                  key={appointment.id}
                  appointment={appointment}
                  emphasis={getEmphasis(appointment)}
                  nextActionLabel={getNextActionLabel(appointment)}
                  surface="dark"
                  onPress={() => navigation.navigate("ProviderAppointmentDetail", { appointment })}
                />
              ))
            )}
          </View>

          <Card variant="outline" style={styles.teamCard}>
            <SectionHeader
              tone="dark"
              title="Team snapshot"
              subtitle="See who is carrying work and where load is uneven."
            />
            <View style={styles.teamList}>
              {teamSnapshot.length === 0 ? (
                <Text style={{ color: "rgba(255,255,255,0.72)" }}>No providers are linked to this company yet.</Text>
              ) : (
                teamSnapshot.map(({ provider, activeCount, readyCount }) => (
                  <TeamRow key={provider.id} provider={provider} activeCount={activeCount} readyCount={readyCount} />
                ))
              )}
            </View>
          </Card>
        </View>
      )}
    </AppScreen>
  );
}

function IconButton({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  return (
    <View style={[styles.iconButton, { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" }]}>
      <Ionicons name={icon} size={18} color={theme.colors.surfaceElevated} />
    </View>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "priority" | "ready" | "active" | "neutral";
}) {
  const theme = useTheme();
  const color = tone === "priority" ? "#F66464" : tone === "ready" ? "#56C271" : tone === "active" ? theme.colors.accent : "rgba(255,255,255,0.76)";
  return (
    <Card variant="outline" style={[styles.summaryCard, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)" }]}>
      <Ionicons
        name={tone === "priority" ? "alert-circle-outline" : tone === "ready" ? "checkmark-circle-outline" : tone === "active" ? "trail-sign-outline" : "calendar-outline"}
        size={22}
        color={color}
      />
      <Text variant="caption" weight="bold" color={color}>
        {label.toUpperCase()}
      </Text>
      <Text variant="h1" weight="bold" style={{ color, marginTop: 2 }}>
        {value}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.68)" }}>{detail}</Text>
    </Card>
  );
}

function TeamRow({ provider, activeCount, readyCount }: { provider: CompanyUser; activeCount: number; readyCount: number }) {
  return (
    <View style={styles.teamRow}>
      <View style={{ flex: 1 }}>
        <Text weight="bold" style={{ color: "#FFFFFF" }}>
          {provider.full_name}
        </Text>
        <Text variant="caption" color="rgba(255,255,255,0.68)">
          {provider.email}
        </Text>
      </View>
      <View style={styles.teamMetrics}>
        <StatusBadge label={`${activeCount} active`} tone="primary" />
        <StatusBadge label={`${readyCount} ready`} tone="success" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
    backgroundColor: "#062E37",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(214, 166, 61, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  headerBlock: {
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  companyTitle: {
    color: "#F8F5EF",
    fontSize: 32,
    lineHeight: 36,
  },
  greetingCopy: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 17,
    lineHeight: 24,
    maxWidth: 330,
  },
  datePillRow: {
    alignItems: "flex-end",
  },
  datePill: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePillText: {
    color: "#F8F5EF",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "47%",
    minHeight: 150,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  attentionCard: {
    gap: 14,
    padding: 18,
    borderWidth: 1,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  attentionTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  alertIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(214, 166, 61, 0.35)",
    backgroundColor: "rgba(214, 166, 61, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  attentionCopy: {
    marginTop: 6,
    color: "rgba(255,255,255,0.74)",
    lineHeight: 22,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCluster: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 6,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterPill: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  jobList: {
    gap: 12,
  },
  teamCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  teamList: {
    marginTop: 12,
    gap: 10,
  },
  teamRow: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamMetrics: {
    gap: 6,
    alignItems: "flex-end",
  },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
});
