import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
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
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { SectionHeader } from "../../components/SectionHeader";
import { AppointmentStatusBadge, StatusBadge } from "../../components/StatusBadge";
import { AppScreen } from "../../components/ui/AppScreen";
import { Text } from "../../components/ui/Text";
import { getReadableAppointmentStatus } from "../../features/appointmentCopy";
import { buildProviderTimeline } from "../../features/providerAdminCopy";
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
  const status = appointmentData?.status ?? appointment.status;
  const assignment = assignmentQuery.data;
  const providers = useMemo(() => (teamQuery.data ?? []).filter((user) => user.role === "provider"), [teamQuery.data]);
  const canAssign = status === "confirmed" && !assignment;
  const isUpdatingAssignment = assignMutation.isPending || reassignMutation.isPending;
  const timelineItems = useMemo(() => buildProviderTimeline(status), [status]);
  const paymentStatus = appointmentData?.payment_status ?? null;
  const paymentMode = appointmentData?.payment_mode ?? null;

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
    <AppScreen scrollable contentContainerStyle={styles.container}>
      <AppCard variant="marketplace" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
              Owner job detail
            </Text>
            <Text variant="h1" weight="bold" style={styles.heroTitle}>
              {appointment.service_name ?? "Appointment"}
            </Text>
          </View>
          <View style={styles.heroBadges}>
            {(appointmentData?.category_name ?? appointment.category_name) ? (
              <StatusBadge label={appointmentData?.category_name ?? appointment.category_name ?? "Care"} tone="primary" />
            ) : null}
            {paymentStatus ? (
              <StatusBadge
                label={`Payment ${paymentStatus.replace("_", " ")}`}
                tone={paymentStatus === "succeeded" ? "success" : paymentStatus === "failed" ? "danger" : "warning"}
              />
            ) : null}
            <AppointmentStatusBadge status={status} />
          </View>
        </View>
        <Text color={theme.colors.textSecondary}>
          {appointmentData?.customer_name ?? appointment.customer_name ?? "Customer"} · {new Date(appointmentData?.start_time ?? appointment.start_time).toLocaleString()}
        </Text>
      </AppCard>

      <AppCard variant="marketplace">
        <SectionHeader title="Snapshot" subtitle="Customer, status, appointment time, and address context." />
        {appointmentQuery.isLoading ? (
          <LoadingState label="Loading appointment snapshot" />
        ) : (
          <View style={styles.infoBlock}>
            <Row label="Customer" value={appointmentData?.customer_name ?? appointment.customer_name ?? "Customer"} />
            <Row label="Status" value={getReadableAppointmentStatus(status)} />
            <Row label="Category" value={appointmentData?.category_name ?? appointment.category_name ?? "Care service"} />
            <Row label="When" value={new Date(appointmentData?.start_time ?? appointment.start_time).toLocaleString()} />
            <Row label="Address" value={appointmentData?.address_line1 ?? appointment.address_line1 ?? "Address pending"} />
            <Row label="Payment" value={paymentMode ? `${paymentMode} / ${paymentStatus ?? "pending"}` : paymentStatus ? paymentStatus : "Not available"} />
          </View>
        )}
      </AppCard>

      <AppCard variant="marketplace">
        <SectionHeader
          title="Assignment control"
          subtitle={assignment ? `${assignment.provider_name ?? "A provider"} currently owns this job.` : "This job is waiting for an available provider."}
        />
        {assignmentQuery.isLoading || teamQuery.isLoading ? (
          <LoadingState label="Loading assignment options" />
        ) : providers.length === 0 ? (
          <EmptyState title="No providers available" message="Add providers before assigning this job." icon="people-outline" />
        ) : (
          <>
            <View style={styles.providerSelector}>
              {providers.map((provider) => {
                const selected = selectedProviderId === provider.id;
                const disabled = assignment?.user_id === provider.id || isUpdatingAssignment;
                return (
                  <Pressable
                    key={provider.id}
                    onPress={() => setSelectedProviderId(provider.id)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Select provider ${provider.full_name}`}
                    accessibilityState={{ selected, disabled }}
                    style={[
                      styles.providerOption,
                      {
                        backgroundColor: selected ? `${theme.colors.primary}12` : theme.colors.surfaceElevated,
                        borderColor: selected ? `${theme.colors.primary}44` : theme.colors.border,
                        opacity: disabled ? 0.55 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text weight="bold">{provider.full_name}</Text>
                      <Text variant="caption" color={theme.colors.textMuted}>
                        {provider.email}
                      </Text>
                    </View>
                    {assignment?.user_id === provider.id ? <StatusBadge label="Current" tone="success" /> : selected ? <StatusBadge label="Selected" tone="primary" /> : null}
                  </Pressable>
                );
              })}
            </View>
            <AppButton
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
              disabled={!selectedProviderId || isUpdatingAssignment}
              loading={isUpdatingAssignment}
              style={styles.assignButton}
            />
          </>
        )}
      </AppCard>

      {trackingQuery.data?.latest_location ? (
        <AppCard variant="marketplace">
          <SectionHeader title="Live travel check" subtitle="Latest provider location ping." />
          <Text color={theme.colors.textSecondary} style={styles.copyTop}>
            {trackingQuery.data.latest_location.lat.toFixed(4)}, {trackingQuery.data.latest_location.lng.toFixed(4)}
          </Text>
          <Text variant="caption" color={theme.colors.textMuted}>
            Recorded {new Date(trackingQuery.data.latest_location.recorded_at).toLocaleString()}
          </Text>
        </AppCard>
      ) : null}

      <AppCard variant="marketplace">
        <SectionHeader title="Progress timeline" subtitle="Owner view of the appointment lifecycle." />
        {eventsQuery.isLoading ? (
          <LoadingState label="Loading appointment activity" />
        ) : eventsQuery.isError ? (
          <EmptyState title="Activity unavailable" message="Refresh to pull the latest appointment events." icon="time-outline" />
        ) : (
          <AppointmentTimeline items={timelineItems} style={styles.timeline} />
        )}
      </AppCard>
    </AppScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text color={theme.colors.textMuted}>{label}</Text>
      <Text weight="bold" style={styles.rowValue}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroBadges: {
    alignItems: "flex-end",
    gap: 8,
  },
  heroTitle: {
    marginTop: 4,
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
  providerOption: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assignButton: {
    marginTop: 14,
  },
  copyTop: {
    marginTop: 12,
  },
  timeline: {
    marginTop: 12,
  },
});
