import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { getAppointment, getAppointmentAssignment, getAppointmentEvents } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import type { AppointmentStackParamList } from "../../navigation/types";
import { appointmentAssignmentQueryKey, appointmentEventsQueryKey, appointmentQueryKey } from "../../query/keys";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

const statusPalette: Record<string, string> = {
  confirmed: "#1B998B",
  requested: "#0F4C5C",
  cleaning: "#E6AF2E",
  ready: "#2EC4B6",
  out_for_delivery: "#2EC4B6",
  delivered: "#1B998B",
  completed: "#059669",
  cancelled: "#9CA3AF",
};

export default function AppointmentDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppointmentStackParamList>>();
  const route = useRoute<RouteProp<AppointmentStackParamList, "AppointmentDetail">>();
  const { appointmentId, summary } = route.params;
  const role = useAuthStore((s) => s.role);
  const isCustomer = role === "customer";

  const appointmentQuery = useQuery({
    queryKey: appointmentQueryKey(appointmentId),
    queryFn: () => getAppointment(appointmentId),
    initialData: summary as any,
    enabled: isCustomer,
  });

  const eventsQuery = useQuery({
    queryKey: appointmentEventsQueryKey(appointmentId),
    queryFn: () => getAppointmentEvents(appointmentId),
    enabled: isCustomer,
  });

  const assignmentQuery = useQuery({
    queryKey: appointmentAssignmentQueryKey(appointmentId),
    queryFn: () => getAppointmentAssignment(appointmentId),
    retry: false,
    enabled: isCustomer,
  });

  const appointment = appointmentQuery.data;
  const eventTimeline = useMemo(() => {
    return (eventsQuery.data ?? []).map((event) => ({
      label: event.kind.replace(/_/g, " "),
      timestamp: new Date(event.created_at).toLocaleString(),
    }));
  }, [eventsQuery.data]);

  if (!isCustomer) {
    return (
      <ScreenContainer contentContainerStyle={styles.center}>
        <Text variant="title" weight="bold">
          Appointments unavailable
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 6, textAlign: "center" }}>
          Appointments are only available for customers.
        </Text>
        <Button
          label="Go home"
          onPress={() => navigation.getParent()?.navigate("HomeTab")}
          style={{ marginTop: 12 }}
        />
      </ScreenContainer>
    );
  }

  if (appointmentQuery.isLoading || !appointment) {
    return (
      <ScreenContainer contentContainerStyle={styles.center}>
        <ActivityIndicator color={theme.colors.peacockPrimary} />
      </ScreenContainer>
    );
  }

  const statusColor = statusPalette[appointment.status] ?? theme.colors.mutedText;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="title" weight="bold">
        {appointment.service_name ?? "Appointment"}
      </Text>
      <Card>
        <Text variant="subtitle" weight="semibold">
          Overview
        </Text>
        <View style={{ marginTop: 10, gap: 8 }}>
          <Row label="Status" value={appointment.status.replace(/_/g, " ")} color={statusColor} />
          <Row label="Customer" value={appointment.customer_name} />
          <Row label="Phone" value={appointment.customer_phone} />
          <Row label="Start" value={new Date(appointment.start_time).toLocaleString()} />
          {appointment.city ? <Row label="Location" value={[appointment.city, appointment.state].filter(Boolean).join(", ")} /> : null}
        </View>
      </Card>

      <Card>
        <Text variant="subtitle" weight="semibold">
          Provider
        </Text>
        {assignmentQuery.isFetching ? (
          <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 10 }} />
        ) : assignmentQuery.data ? (
          <Text style={{ marginTop: 8 }}>
            Assigned to {assignmentQuery.data.provider_name ?? "provider"}
          </Text>
        ) : (
          <Text style={{ marginTop: 8 }} color={theme.colors.mutedText}>
            No provider assigned yet.
          </Text>
        )}
      </Card>

      <Card>
        <Text variant="subtitle" weight="semibold">
          Updates
        </Text>
        {eventsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 8 }} />
        ) : eventTimeline.length === 0 ? (
          <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
            No updates yet.
          </Text>
        ) : (
          <View style={{ marginTop: 10, gap: 10 }}>
            {eventTimeline.map((evt) => (
              <View key={`${evt.label}-${evt.timestamp}`} style={styles.timelineRow}>
                <View style={[styles.dot, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1 }}>
                  <Text weight="semibold">{evt.label}</Text>
                  <Text variant="caption" color={theme.colors.mutedText}>
                    {evt.timestamp}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScreenContainer>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text color={theme.colors.mutedText}>{label}</Text>
      <Text weight="semibold" style={{ color: color ?? theme.colors.textCharcoal }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

