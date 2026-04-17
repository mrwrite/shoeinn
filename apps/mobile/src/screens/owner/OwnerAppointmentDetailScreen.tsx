import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignAppointment,
  getAppointment,
  getAppointmentEvents,
  getAppointmentTracking,
  getProviderAppointmentAssignment,
  listCompanyUsers,
  reassignAppointment,
} from "../../api/http";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { ScreenContainer } from "../../components/ScreenContainer";
import type { ProviderStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

const TRAVEL_STATUSES = new Set(["en_route_pickup", "out_for_delivery"]);

export default function OwnerAppointmentDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<ProviderStackParamList, "ProviderAppointmentDetail">>();
  const { appointment } = route.params;
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const appointmentQuery = useQuery({
    queryKey: ["appointment", appointment.id],
    queryFn: () => getAppointment(appointment.id),
  });
  const assignmentQuery = useQuery({
    queryKey: ["appointment", appointment.id, "assignment"],
    queryFn: () => getProviderAppointmentAssignment(appointment.id),
    retry: false,
  });
  const eventsQuery = useQuery({
    queryKey: ["appointment", appointment.id, "events"],
    queryFn: () => getAppointmentEvents(appointment.id),
  });
  const teamQuery = useQuery({
    queryKey: ["company", "users"],
    queryFn: listCompanyUsers,
  });
  const trackingQuery = useQuery({
    queryKey: ["appointment", appointment.id, "tracking"],
    queryFn: () => getAppointmentTracking(appointment.id),
    enabled: TRAVEL_STATUSES.has(appointment.status),
  });

  const assignMutation = useMutation({
    mutationFn: (providerUserId: string) => assignAppointment(appointment.id, providerUserId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["provider", "open"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id, "assignment"] }),
      ]);
      setSelectedProviderId(null);
    },
    onError: (err: Error) => Alert.alert("Assignment failed", err.message),
  });
  const reassignMutation = useMutation({
    mutationFn: (providerUserId: string) => reassignAppointment(appointment.id, providerUserId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["provider", "open"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id, "assignment"] }),
      ]);
      setSelectedProviderId(null);
    },
    onError: (err: Error) => Alert.alert("Reassignment failed", err.message),
  });

  const appointmentData = appointmentQuery.data;
  const assignment = assignmentQuery.data;
  const providers = useMemo(
    () => (teamQuery.data ?? []).filter((user) => user.role === "provider"),
    [teamQuery.data],
  );
  const canAssign = appointment.status === "confirmed" && !assignment;

  const handleAssign = async () => {
    if (!selectedProviderId) {
      Alert.alert("Select a provider", "Choose a team member to assign before continuing.");
      return;
    }
    if (canAssign) {
      await assignMutation.mutateAsync(selectedProviderId);
      return;
    }
    await reassignMutation.mutateAsync(selectedProviderId);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Text variant="title" weight="bold">
        {appointment.service_name ?? "Owner job detail"}
      </Text>
      <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
        Review ownership, progress, and the next best move for this customer order.
      </Text>

      <Card>
        <Text variant="subtitle" weight="bold">
          Snapshot
        </Text>
        {appointmentQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 12 }} />
        ) : (
          <View style={styles.infoBlock}>
            <Row label="Customer" value={appointmentData?.customer_name ?? appointment.customer_name ?? "Customer"} />
            <Row label="Status" value={(appointmentData?.status ?? appointment.status).replace(/_/g, " ")} />
            <Row label="When" value={new Date(appointmentData?.start_time ?? appointment.start_time).toLocaleString()} />
            <Row label="Address" value={appointmentData?.address_line1 ?? appointment.address_line1 ?? "Address pending"} />
          </View>
        )}
      </Card>

      <Card>
        <Text variant="subtitle" weight="bold">
          Assignment control
        </Text>
        {assignmentQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 12 }} />
        ) : (
          <>
            <Text color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              {assignment
                ? `${assignment.provider_name ?? "A provider"} currently owns this job.`
                : "This job is still waiting for an available provider."}
            </Text>
            <View style={styles.providerSelector}>
              {providers.map((provider) => {
                const selected = selectedProviderId === provider.id;
                const disabled = assignment?.user_id === provider.id;
                return (
                  <Button
                    key={provider.id}
                    label={provider.full_name}
                    variant={selected ? "primary" : "secondary"}
                    onPress={() => setSelectedProviderId(provider.id)}
                    disabled={disabled}
                    style={styles.providerButton}
                  />
                );
              })}
            </View>
            <Button
              label={
                canAssign
                  ? assignMutation.isPending
                    ? "Assigning..."
                    : "Assign selected provider"
                  : reassignMutation.isPending
                    ? "Reassigning..."
                    : "Reassign selected provider"
              }
              onPress={() => {
                void handleAssign();
              }}
              disabled={!selectedProviderId || assignMutation.isPending || reassignMutation.isPending}
              loading={assignMutation.isPending || reassignMutation.isPending}
              style={{ marginTop: 14 }}
            />
            <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              Use this as the owner's intervention moment during the demo. Unassigned jobs can be assigned here. Assigned jobs can be rerouted if the day changes.
            </Text>
          </>
        )}
      </Card>

      {trackingQuery.data?.latest_location ? (
        <Card>
          <Text variant="subtitle" weight="bold">
            Live travel check
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 8 }}>
            Latest provider ping: {trackingQuery.data.latest_location.lat.toFixed(4)}, {trackingQuery.data.latest_location.lng.toFixed(4)}
          </Text>
          <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            Recorded {new Date(trackingQuery.data.latest_location.recorded_at).toLocaleString()}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text variant="subtitle" weight="bold">
          Recent activity
        </Text>
        {eventsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 12 }} />
        ) : (
          <View style={styles.timeline}>
            {(eventsQuery.data ?? []).slice(-6).reverse().map((event) => (
              <View key={event.id} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text weight="semibold">{event.kind.replace(/_/g, " ")}</Text>
                  <Text variant="caption" color={theme.colors.mutedText}>
                    {new Date(event.created_at).toLocaleString()}
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

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text color={theme.colors.mutedText}>{label}</Text>
      <Text weight="semibold" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  infoBlock: {
    marginTop: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
  },
  providerSelector: {
    marginTop: 12,
    gap: 10,
  },
  providerButton: {
    width: "100%",
  },
  timeline: {
    marginTop: 12,
    gap: 10,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#0F4C5C",
  },
});
