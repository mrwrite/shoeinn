import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  claimAppointment,
  fetchOpenAppointments,
  fetchMyAppointments,
} from "../../api/http";
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
    },
    onError: (err: Error) => {
      setFeedback(getClaimFeedback(err));
    },
  });

  React.useEffect(() => {
    setFeedback(null);
  }, [activeTab]);

  const activeQuery = activeTab === "available" ? openAppointmentsQuery : myAppointmentsQuery;
  const availableCount = openAppointmentsQuery.data?.length ?? 0;
  const myCount = myAppointmentsQuery.data?.length ?? 0;

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
          ? "Review the job details before claiming. Claiming assigns the job to you."
          : undefined
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
      ? "There are no claimable jobs right now. Pull to refresh or check back soon."
      : "Claim a job from Available Jobs and it will appear here for follow-through.";

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

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        availableCount={availableCount}
        myCount={myCount}
      />

      <View style={styles.summaryCard}>
        <Text weight="semibold">{tabSummary}</Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
          {activeTab === "available"
            ? "Open a job to inspect the details, then claim it when you are ready."
            : "Use this list to keep your current workload moving."}
        </Text>
      </View>

      {feedback ? (
        <View
          style={[
            styles.feedback,
            feedback.tone === "success" && styles.feedbackSuccess,
            feedback.tone === "warning" && styles.feedbackWarning,
            feedback.tone === "danger" && styles.feedbackDanger,
          ]}
        >
          <Text
            weight="semibold"
            color={
              feedback.tone === "danger"
                ? theme.colors.danger
                : theme.colors.textCharcoal
            }
          >
            {feedback.message}
          </Text>
        </View>
      ) : null}

      {activeQuery.isLoading ? (
        <QueryStateCard
          title={activeTab === "available" ? "Loading available jobs" : "Loading your jobs"}
          message={
            activeTab === "available"
              ? "Fetching the latest claimable jobs for your area."
              : "Fetching the jobs currently assigned to you."
          }
        />
      ) : activeQuery.isError ? (
        <QueryStateCard
          title={activeTab === "available" ? "Available jobs unavailable" : "My jobs unavailable"}
          message={
            activeTab === "available"
              ? "We could not load claimable jobs right now. Try again to refresh the dashboard."
              : "We could not load your assigned jobs right now. Try again to refresh this list."
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
              actionLabel={activeTab === "available" ? "Refresh" : undefined}
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
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
});
