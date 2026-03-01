import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  claimAppointment,
  getProviderAppointmentAssignment,
  updateAppointmentStatus,
} from "../../api/http";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { TravelMapCard } from "../../components/TravelMapCard";
import type { ProviderStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { AppointmentStatus } from "../../types/booking";

const statusOptions: AppointmentStatus[] = [
  "confirmed",
  "en_route_pickup",
  "picked_up",
  "cleaning",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

export default function ProviderAppointmentDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<ProviderStackParamList, "ProviderAppointmentDetail">>();
  const { appointment } = route.params;
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const assignmentQuery = useQuery({
    queryKey: ["appointment", appointment.id, "assignment"],
    queryFn: () => getProviderAppointmentAssignment(appointment.id),
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: (next: AppointmentStatus) =>
      updateAppointmentStatus(appointment.id, {
        status: next,
        confirmed_time: next === "confirmed" ? new Date().toISOString() : undefined,
      }),
    onSuccess: (_, next) => {
      setStatus(next);
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
    },
    onError: (err: Error) => Alert.alert("Update failed", err.message),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimAppointment(appointment.id),
    onSuccess: (data) => {
      queryClient.setQueryData(["appointment", appointment.id, "assignment"], data);
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
    },
    onError: (err: Error) => Alert.alert("Claim failed", err.message),
  });

  const assignment = assignmentQuery.data;
  const isUnassigned = !assignment && (!assignmentQuery.error || `${assignmentQuery.error}`.includes("404"));
  const assignedToMe = assignment?.user_id === userId;
  const showTravelCard =
    assignedToMe && (status === "en_route_pickup" || status === "out_for_delivery");

  const info = useMemo(
    () => [
      { label: "Service", value: appointment.service_name ?? "Appointment" },
      { label: "Start", value: new Date(appointment.start_time).toLocaleString() },
      {
        label: "Location",
        value: [appointment.customer_city, appointment.customer_state].filter(Boolean).join(", ") || "",
      },
    ],
    [appointment],
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.surfaceLight }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="title" weight="bold">
        {appointment.service_name ?? "Appointment"}
      </Text>

      {showTravelCard ? <TravelMapCard appointment={{ ...appointment, status }} /> : null}

      <Card>
        <Text variant="subtitle" weight="semibold">
          Details
        </Text>
        <View style={{ marginTop: 10, gap: 8 }}>
          {info.map((item) => (
            <Row key={item.label} label={item.label} value={item.value} />
          ))}
          <Row label="Status" value={status.replace(/_/g, " ")} />
        </View>
      </Card>

      <Card>
        <Text variant="subtitle" weight="semibold">
          Assignment
        </Text>
        {assignmentQuery.isFetching ? (
          <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 10 }} />
        ) : assignment ? (
          <Text style={{ marginTop: 8 }}>
            Assigned {assignment.provider_name ? `to ${assignment.provider_name}` : ""}
            {assignedToMe ? " (you)" : ""}
          </Text>
        ) : (
          <Text style={{ marginTop: 8 }} color={theme.colors.mutedText}>
            No provider assigned yet.
          </Text>
        )}
        {isUnassigned ? (
          <Button
            label={claimMutation.isPending ? "Claiming..." : "Claim appointment"}
            onPress={() => claimMutation.mutate()}
            loading={claimMutation.isPending}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </Card>

      <Card>
        <Text variant="subtitle" weight="semibold">
          Status updates
        </Text>
        <View style={{ marginTop: 10, gap: 8 }}>
          {statusOptions.map((opt) => (
            <Button
              key={opt}
              label={opt.replace(/_/g, " ")}
              variant={status === opt ? "primary" : "secondary"}
              onPress={() => statusMutation.mutate(opt)}
              disabled={statusMutation.isPending}
              style={{ marginBottom: 8 }}
            />
          ))}
          <Text variant="caption" color={theme.colors.mutedText}>
            Tap a status to update progress.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text color={theme.colors.mutedText}>{label}</Text>
      <Text weight="semibold">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
