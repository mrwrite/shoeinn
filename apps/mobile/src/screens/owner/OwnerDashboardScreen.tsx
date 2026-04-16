import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { fetchOpenAppointments, getCompany, listCompanyUsers } from "../../api/http";
import { OwnerJobCard } from "../../components/OwnerJobCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import type { ProviderStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { CompanyUser, ProviderAppointment } from "../../types/company";

type FilterKey = "unassigned" | "in_progress" | "ready" | "all";

const IN_PROGRESS_STATUSES = new Set(["en_route_pickup", "picked_up", "cleaning", "out_for_delivery"]);
const READY_STATUSES = new Set(["ready"]);

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getFilteredAppointments(items: ProviderAppointment[], filter: FilterKey) {
  switch (filter) {
    case "unassigned":
      return items.filter((item) => !item.provider_name && item.status === "confirmed");
    case "in_progress":
      return items.filter((item) => IN_PROGRESS_STATUSES.has(item.status));
    case "ready":
      return items.filter((item) => READY_STATUSES.has(item.status));
    default:
      return items;
  }
}

function getNextActionLabel(item: ProviderAppointment) {
  if (!item.provider_name && item.status === "confirmed") {
    return "Needs assignment";
  }
  if (item.status === "ready") {
    return "Ready to deliver";
  }
  if (IN_PROGRESS_STATUSES.has(item.status)) {
    return "In motion";
  }
  return "Review job";
}

function getEmphasis(item: ProviderAppointment): "priority" | "ready" | "active" | "neutral" {
  if (!item.provider_name && item.status === "confirmed") {
    return "priority";
  }
  if (item.status === "ready") {
    return "ready";
  }
  if (IN_PROGRESS_STATUSES.has(item.status)) {
    return "active";
  }
  return "neutral";
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
    () =>
      [...(jobsQuery.data ?? [])].sort(
        (left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime(),
      ),
    [jobsQuery.data],
  );
  const todaysJobs = jobs.filter((item) => isToday(item.start_time));
  const unassigned = jobs.filter((item) => !item.provider_name && item.status === "confirmed");
  const inProgress = jobs.filter((item) => IN_PROGRESS_STATUSES.has(item.status));
  const ready = jobs.filter((item) => READY_STATUSES.has(item.status));
  const filteredJobs = getFilteredAppointments(jobs, selectedFilter);

  const teamSnapshot = useMemo(() => {
    const providers = (teamQuery.data ?? []).filter((user) => user.role === "provider");
    return providers.map((provider) => {
      const activeCount = jobs.filter(
        (job) =>
          job.assigned_user_id === provider.id &&
          !["completed", "cancelled", "delivered"].includes(job.status),
      ).length;
      const readyCount = jobs.filter(
        (job) => job.assigned_user_id === provider.id && job.status === "ready",
      ).length;
      return { provider, activeCount, readyCount };
    });
  }, [jobs, teamQuery.data]);

  const recentActivity = jobs.slice(0, 3).map((item) => ({
    id: item.id,
    label: `${item.service_name ?? "Appointment"} is ${item.status.replace(/_/g, " ")}`,
    detail: item.provider_name ? `${item.provider_name} owns this job.` : "Waiting for an available provider.",
  }));

  const greetingName = fullName?.split(" ")[0] ?? "Owner";
  const refreshing = jobsQuery.isRefetching || teamQuery.isRefetching || companyQuery.isRefetching;

  return (
    <ScreenContainer>
      {jobsQuery.isLoading || teamQuery.isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.colors.peacockPrimary} />
          <Text color={theme.colors.mutedText}>Loading today's operation snapshot.</Text>
        </View>
      ) : jobsQuery.isError || teamQuery.isError ? (
        <View style={styles.state}>
          <Text weight="semibold" color={theme.colors.danger}>
            The owner dashboard is unavailable right now.
          </Text>
          <Text color={theme.colors.mutedText} style={{ textAlign: "center" }}>
            Pull to refresh after checking the local API and demo seed state.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            void jobsQuery.refetch();
            void teamQuery.refetch();
            void companyQuery.refetch();
          }} />}
          contentContainerStyle={styles.content}
        >
          <View style={styles.headerBlock}>
            <Text variant="overline" weight="semibold" color={theme.colors.peacockPrimary}>
              Owner command center
            </Text>
            <Text variant="title" weight="bold" style={{ marginTop: 8 }}>
              {companyQuery.data?.name ?? "Your shop"}
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
              {`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${greetingName}. Here is today's pickup-and-delivery picture.`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <SummaryCard label="Today" value={`${todaysJobs.length}`} detail="Jobs on today's board" tone="neutral" />
            <SummaryCard label="Unassigned" value={`${unassigned.length}`} detail="Need owner attention" tone={unassigned.length > 0 ? "priority" : "neutral"} />
            <SummaryCard label="In progress" value={`${inProgress.length}`} detail="Currently moving" tone="active" />
            <SummaryCard label="Ready" value={`${ready.length}`} detail="Almost complete" tone="ready" />
          </View>

          {unassigned.length > 0 ? (
            <Card style={styles.alertCard}>
              <Text variant="subtitle" weight="bold" style={{ color: "#991B1B" }}>
                {unassigned.length === 1 ? "1 job needs an assignment now" : `${unassigned.length} jobs need assignments now`}
              </Text>
              <Text color="#7F1D1D" style={{ marginTop: 6 }}>
                Start with the unassigned queue so the owner story immediately shows where attention is needed.
              </Text>
            </Card>
          ) : (
            <Card style={styles.goodCard}>
              <Text variant="subtitle" weight="bold" style={{ color: "#166534" }}>
                No unassigned jobs right now
              </Text>
              <Text color="#166534" style={{ marginTop: 6 }}>
                The board is covered and the team can focus on progress and delivery.
              </Text>
            </Card>
          )}

          <Card style={styles.filterCard}>
            <Text variant="subtitle" weight="bold">
              Jobs board
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              Filter the board the way a cleaner owner would think about the day.
            </Text>
            <View style={styles.filterRow}>
              {([
                { key: "unassigned", label: "Unassigned" },
                { key: "in_progress", label: "In Progress" },
                { key: "ready", label: "Ready" },
                { key: "all", label: "All" },
              ] as const).map((option) => {
                const active = selectedFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSelectedFilter(option.key)}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                  >
                    <Text variant="caption" weight="semibold" color={active ? theme.colors.peacockPrimary : theme.colors.mutedText}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <View style={styles.jobList}>
            {filteredJobs.length === 0 ? (
              <Card>
                <Text weight="semibold">Nothing in this segment right now</Text>
                <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
                  Switch filters or pull to refresh after reseeding the local demo data.
                </Text>
              </Card>
            ) : (
              filteredJobs.map((appointment) => (
                <OwnerJobCard
                  key={appointment.id}
                  appointment={appointment}
                  emphasis={getEmphasis(appointment)}
                  nextActionLabel={getNextActionLabel(appointment)}
                  onPress={() => navigation.navigate("ProviderAppointmentDetail", { appointment })}
                />
              ))
            )}
          </View>

          <Card style={styles.teamCard}>
            <Text variant="subtitle" weight="bold">
              Team snapshot
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              Show who is carrying the work and where load is uneven.
            </Text>
            <View style={styles.teamList}>
              {teamSnapshot.length === 0 ? (
                <Text color={theme.colors.mutedText}>No providers are linked to this company yet.</Text>
              ) : (
                teamSnapshot.map(({ provider, activeCount, readyCount }) => (
                  <TeamRow key={provider.id} provider={provider} activeCount={activeCount} readyCount={readyCount} />
                ))
              )}
            </View>
          </Card>

          <Card>
            <Text variant="subtitle" weight="bold">
              Recent activity
            </Text>
            <View style={{ marginTop: 10, gap: 10 }}>
              {recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold">{activity.label}</Text>
                    <Text variant="caption" color={theme.colors.mutedText}>
                      {activity.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>
      )}
    </ScreenContainer>
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
  const palette = {
    priority: { background: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
    ready: { background: "#ECFDF5", border: "#86EFAC", text: "#166534" },
    active: { background: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
    neutral: { background: "#F8FAFC", border: "#E2E8F0", text: "#334155" },
  }[tone];

  return (
    <Card style={[styles.summaryCard, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text variant="overline" weight="semibold" style={{ color: palette.text }}>
        {label}
      </Text>
      <Text variant="title" weight="bold" style={{ color: palette.text, marginTop: 4 }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: palette.text, marginTop: 4 }}>
        {detail}
      </Text>
    </Card>
  );
}

function TeamRow({
  provider,
  activeCount,
  readyCount,
}: {
  provider: CompanyUser;
  activeCount: number;
  readyCount: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.teamRow}>
      <View style={{ flex: 1 }}>
        <Text weight="semibold">{provider.full_name}</Text>
        <Text variant="caption" color={theme.colors.mutedText}>
          {provider.email}
        </Text>
      </View>
      <View style={styles.teamMetrics}>
        <View style={styles.teamMetricPill}>
          <Text variant="caption" weight="semibold">
            {activeCount} active
          </Text>
        </View>
        <View style={[styles.teamMetricPill, styles.teamMetricReady]}>
          <Text variant="caption" weight="semibold" style={{ color: "#166534" }}>
            {readyCount} ready
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  headerBlock: {
    marginBottom: 6,
  },
  state: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "47%",
    borderWidth: 1,
  },
  alertCard: {
    marginTop: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  goodCard: {
    marginTop: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  filterCard: {
    marginTop: 14,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterPillActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  jobList: {
    marginTop: 14,
    gap: 12,
  },
  teamCard: {
    marginTop: 14,
  },
  teamList: {
    marginTop: 12,
    gap: 10,
  },
  teamRow: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamMetrics: {
    flexDirection: "row",
    gap: 8,
  },
  teamMetricPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E2E8F0",
  },
  teamMetricReady: {
    backgroundColor: "#DCFCE7",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#0F4C5C",
  },
});
