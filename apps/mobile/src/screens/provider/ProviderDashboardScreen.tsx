import React from "react";
import {
  ActivityIndicator,
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
  fetchMyAppointments, // 👈 add this API function
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

function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <View style={tabStyles.container}>
      <TabButton
        label="Available Jobs"
        active={active === "available"}
        onPress={() => onChange("available")}
      />
      <TabButton
        label="My Jobs"
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
    enabled: activeTab === "my", // 👈 don’t fetch until user views the tab
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
    />
  );

  const title = activeTab === "available" ? "Available jobs" : "My jobs";
  const subtitle =
    activeTab === "available"
      ? "Claim and complete nearby bookings"
      : "Jobs you’ve claimed to complete";

  const emptyTitle = activeTab === "available" ? "No available jobs" : "No claimed jobs";
  const emptySubtitle =
    activeTab === "available"
      ? "Pull to refresh or check back later."
      : "Claim a job from the Available Jobs tab to see it here.";

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

      <Tabs active={activeTab} onChange={setActiveTab} />

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
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.peacockPrimary} />
        </View>
      ) : activeQuery.isError ? (
        <View style={styles.center}>
          <Text color={theme.colors.danger} weight="semibold">
            Failed to load jobs
          </Text>
          <Button
            label="Retry"
            onPress={() => activeQuery.refetch()}
            style={{ marginTop: 12 }}
          />
        </View>
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
            <View style={styles.empty}>
              <Text weight="semibold">{emptyTitle}</Text>
              <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
                {emptySubtitle}
              </Text>
            </View>
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
});
