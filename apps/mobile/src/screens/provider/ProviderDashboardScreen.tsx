import React from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  claimAppointment,
  fetchMyAppointments,
  fetchOpenAppointments,
} from "../../api/http";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import { AppointmentCard } from "../../components/AppointmentCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import type { ProviderStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import type { ProviderAppointment } from "../../types/company";

type TabKey = "available" | "my";
type FeedbackTone = "success" | "warning" | "danger";

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
} | null;

type QueryStateCardProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

function getClaimFeedback(error: Error): FeedbackState {
  const message = error.message.toLowerCase();
  if (
    message.includes("already assigned") ||
    message.includes("conflict") ||
    message.includes("no longer available") ||
    message.includes("409")
  ) {
    return {
      tone: "warning",
      message: "This job is no longer available. Refresh to see the latest list.",
    };
  }

  return {
    tone: "danger",
    message: "Unable to claim this job right now. Try again or refresh the list.",
  };
}

function QueryStateCard({ title, message, actionLabel, onAction }: QueryStateCardProps) {
  const theme = useTheme();

  return (
    <View style={styles.stateCard}>
      <Text variant="subtitle" weight="semibold">
        {title}
      </Text>
      <Text color={theme.colors.mutedText} style={{ marginTop: 6, textAlign: "center" }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: 14 }} />
      ) : null}
    </View>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "teal" | "neutral";
}) {
  const colors = {
    primary: { background: "#eff6ff", border: "#93c5fd", text: "#0F4C5C" },
    teal: { background: "#ecfdf5", border: "#86efac", text: "#166534" },
    neutral: { background: "#f8fafc", border: "#e2e8f0", text: "#475569" },
  }[tone];

  return (
    <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text variant="overline" weight="semibold" style={{ color: colors.text }}>
        {label}
      </Text>
      <Text variant="subtitle" weight="bold" style={{ color: colors.text, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function Tabs({
  active,
  onChange,
  availableCount,
  myCount,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  availableCount: number;
  myCount: number;
}) {
  return (
    <View style={tabStyles.container}>
      <TabButton
        label={`Available Jobs (${availableCount})`}
        active={active === "available"}
        onPress={() => onChange("available")}
      />
      <TabButton
        label={`My Jobs (${myCount})`}
        active={active === "my"}
        onPress={() => onChange("my")}
      />
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      label={label}
      variant={active ? "primary" : "secondary"}
      onPress={onPress}
      style={tabStyles.button}
    />
  );
}

function formatOperationalCue(appointments: ProviderAppointment[] | undefined, mode: TabKey) {
  if (!appointments || appointments.length === 0) {
    return mode === "available"
      ? "No claimable jobs are waiting right now."
      : "No active assigned jobs right now.";
  }

  const byTime = [...appointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const earliest = byTime[0];

  if (mode === "available") {
    return `Next pickup window starts ${new Date(earliest.start_time).toLocaleString()}.`;
  }

  return `${earliest.service_name ?? "Appointment"} is your next active job, currently ${earliest.status.replace(/_/g, " ")}.`;
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  button: {
    flex: 1,
  },
});

export default function ProviderDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<TabKey>("available");
  const [feedback, setFeedback] = React.useState<FeedbackState>(null);

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
      setFeedback({
        tone: "success",
        message: "Job claimed. It now appears in My Jobs.",
      });
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
      queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      void openAppointmentsQuery.refetch();
      void myAppointmentsQuery.refetch();
    },
    onError: (err: Error) => {
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
  const dashboardCue = formatOperationalCue(
    activeTab === "available" ? openAppointmentsQuery.data : myAppointmentsQuery.data,
    activeTab,
  );

  const renderItem = ({ item }: { item: ProviderAppointment }) => (
    <AppointmentCard
      appointment={{
        id: item.id,
        customer_name: "Customer",
        customer_phone: "",
        address_line1: null,
        address_line2: null,
        city: item.customer_city,
        state: item.customer_state,
        postal_code: null,
        company_id: undefined,
        service_name: item.service_name,
        start_time: item.start_time,
        status: item.status,
      }}
      onPress={() => navigation.navigate("ProviderAppointmentDetail", { appointment: item })}
      onClaim={
        activeTab === "available" ? () => claimMutation.mutate(item.id) : undefined
      }
      claimable={activeTab === "available"}
      helperText={
        activeTab === "available"
          ? "Start with the card details. Claim only when this window and route work for you."
          : "This job is already in your queue. Open it for the current next step and route details."
      }
      actionLabel={activeTab === "available" ? "Available to claim" : "Assigned to you"}
      emphasis={activeTab === "available" ? "actionable" : "owned"}
    />
  );

  const title = activeTab === "available" ? "Available jobs" : "My jobs";
  const subtitle =
    activeTab === "available"
      ? "Claimable jobs that still need a provider"
      : "Jobs currently assigned to you";
  const tabSummary =
    activeTab === "available"
      ? availableCount > 0
        ? `${availableCount} job${availableCount === 1 ? "" : "s"} ready to review and claim.`
        : "No claimable jobs right now."
      : myCount > 0
        ? `${myCount} job${myCount === 1 ? "" : "s"} currently assigned to you.`
        : "You have no assigned jobs at the moment.";

  const emptyTitle = activeTab === "available" ? "No available jobs" : "No claimed jobs";
  const emptySubtitle =
    activeTab === "available"
      ? "Nothing needs a provider right now. Pull to refresh or check back for the next pickup window."
      : "Your queue is clear. Claim a job from Available Jobs and it will appear here.";

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          {title}
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.summaryStrip}>
        <View style={styles.summaryHero}>
          <Text variant="overline" weight="semibold" color={theme.colors.peacockPrimary}>
            Dispatch overview
          </Text>
          <Text variant="subtitle" weight="bold" style={{ marginTop: 6 }}>
            {tabSummary}
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            {dashboardCue}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <SummaryMetric label="Available" value={`${availableCount}`} tone="teal" />
          <SummaryMetric label="My jobs" value={`${myCount}`} tone="primary" />
          <SummaryMetric
            label={activeTab === "available" ? "Focus" : "Next up"}
            value={activeTab === "available" ? "Claimable now" : "Move your queue"}
            tone="neutral"
          />
        </View>
      </View>

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        availableCount={availableCount}
        myCount={myCount}
      />

      {feedback ? (
        <View
          style={[
            styles.feedback,
            feedback.tone === "success" && styles.feedbackSuccess,
            feedback.tone === "warning" && styles.feedbackWarning,
            feedback.tone === "danger" && styles.feedbackDanger,
          ]}
        >
          <Text weight="semibold" color={feedback.tone === "danger" ? theme.colors.danger : theme.colors.textCharcoal}>
            {feedback.message}
          </Text>
        </View>
      ) : null}

      {activeQuery.isLoading ? (
        <QueryStateCard
          title={activeTab === "available" ? "Warming up today’s job board" : "Pulling in your active queue"}
          message={
            activeTab === "available"
              ? "We’re checking the latest claimable work so you can decide what to take next."
              : "We’re loading the jobs already assigned to you."
          }
        />
      ) : activeQuery.isError ? (
        <QueryStateCard
          title={activeTab === "available" ? "The job board is unavailable right now" : "Your queue is unavailable right now"}
          message={
            activeTab === "available"
              ? "We couldn’t refresh the available jobs list. Try again to pull the latest dispatch state."
              : "We couldn’t refresh your assigned jobs. Try again to pull the latest queue state."
          }
          actionLabel="Retry"
          onAction={() => activeQuery.refetch()}
        />
      ) : (
        <FlatList
          data={activeQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={() => activeQuery.refetch()}
            />
          }
          ListEmptyComponent={
            <QueryStateCard
              title={emptyTitle}
              message={emptySubtitle}
              actionLabel={activeTab === "available" ? "Refresh board" : undefined}
              onAction={activeTab === "available" ? () => activeQuery.refetch() : undefined}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    gap: 4,
  },
  summaryStrip: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 12,
  },
  summaryHero: {
    gap: 2,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  feedback: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#86efac",
  },
  feedbackWarning: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  feedbackDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
});
