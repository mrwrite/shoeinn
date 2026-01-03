import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { getAppointment, getAppointmentAssignment, getAppointmentEvents } from "../../api/http";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import type { AppointmentStackParamList } from "../../navigation/RootTabs";
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
  const route = useRoute<RouteProp<AppointmentStackParamList, "AppointmentDetail">>();
  const { appointmentId, summary } = route.params;

  const appointmentQuery = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getAppointment(appointmentId),
    initialData: summary as any,
  });

  const eventsQuery = useQuery({
    queryKey: ["appointment", appointmentId, "events"],
    queryFn: () => getAppointmentEvents(appointmentId),
  });

  const assignmentQuery = useQuery({
    queryKey: ["appointment", appointmentId, "assignment"],
    queryFn: () => getAppointmentAssignment(appointmentId),
    retry: false,
  });

  const appointment = appointmentQuery.data;
  const eventTimeline = useMemo(() => {
    return (eventsQuery.data ?? []).map((event) => ({
      label: event.kind.replace(/_/g, " "),
      timestamp: new Date(event.created_at).toLocaleString(),
    }));
  }, [eventsQuery.data]);

  if (appointmentQuery.isLoading || !appointment) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.peacockPrimary} />
      </View>
    );
  }

  const statusColor = statusPalette[appointment.status] ?? theme.colors.mutedText;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.surfaceLight }} contentContainerStyle={{ padding: 16, gap: 12 }}>
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
    </ScrollView>
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

