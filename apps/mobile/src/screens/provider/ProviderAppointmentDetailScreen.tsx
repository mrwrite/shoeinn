import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

import {
  claimAppointment,
  getProviderAppointmentAssignment,
  setAppointmentReadyWithPhoto,
  updateAppointmentStatus,
} from "../../api/http";
import { AppointmentTimeline, type AppointmentTimelineItem } from "../../components/AppointmentTimeline";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { LoadingState } from "../../components/LoadingState";
import { SectionHeader } from "../../components/SectionHeader";
import { AppointmentStatusBadge, StatusBadge } from "../../components/StatusBadge";
import { TravelMapCard } from "../../components/TravelMapCard";
import { Text } from "../../components/ui/Text";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import { getReadableAppointmentStatus } from "../../features/appointmentCopy";
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

type ProviderAssignmentState =
  | { kind: "assigned_to_me"; message: string }
  | { kind: "assigned_to_other"; message: string }
  | { kind: "unassigned"; message: string }
  | { kind: "assignment_unavailable"; message: string };

type FeedbackTone = "success" | "warning" | "danger";

export function getRecommendedNextStatus(status: AppointmentStatus): AppointmentStatus | null {
  const nextStatusMap: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
    confirmed: "en_route_pickup",
    en_route_pickup: "picked_up",
    picked_up: "cleaning",
    cleaning: "ready",
    ready: "out_for_delivery",
    out_for_delivery: "delivered",
    delivered: "completed",
  };

  return nextStatusMap[status] ?? null;
}

export function getClaimFeedback(error: Error): { tone: FeedbackTone; message: string } {
  const message = error.message.toLowerCase();
  if (
    message.includes("already assigned") ||
    message.includes("conflict") ||
    message.includes("no longer available") ||
    message.includes("409")
  ) {
    return { tone: "warning", message: "This appointment is no longer available to claim." };
  }

  return { tone: "danger", message: "Unable to claim this appointment right now. Try again shortly." };
}

export function buildProviderTimeline(status: AppointmentStatus): AppointmentTimelineItem[] {
  const currentIndex = statusOptions.indexOf(status);
  return statusOptions
    .filter((item) => (status === "cancelled" ? item === "cancelled" || statusOptions.indexOf(item) <= currentIndex : item !== "cancelled"))
    .map((item, index) => ({
      key: item,
      title: getReadableAppointmentStatus(item),
      detail: item === status ? "Current job state" : index < currentIndex ? "Completed" : "Next step",
      state: item === status && ["completed", "cancelled"].includes(item) ? "terminal" : item === status ? "current" : index < currentIndex ? "completed" : "upcoming",
    }));
}

export default function ProviderAppointmentDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<ProviderStackParamList, "ProviderAppointmentDetail">>();
  const { appointment } = route.params;
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [pendingReadyPhotoUri, setPendingReadyPhotoUri] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{ tone: FeedbackTone; message: string } | null>(null);
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();
  const isLiveAppointment = !["completed", "cancelled"].includes(status);

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
      queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id, "assignment"] });
      void assignmentQuery.refetch();
    },
    onError: (err: Error) => Alert.alert("Update failed", err.message),
  });

  const readyMutation = useMutation({
    mutationFn: (uri: string) => setAppointmentReadyWithPhoto(appointment.id, uri),
    onSuccess: () => {
      setStatus("ready");
      setPendingReadyPhotoUri(null);
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
      queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id, "assignment"] });
      void assignmentQuery.refetch();
    },
    onError: (err: Error) => Alert.alert("Upload failed", err.message),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimAppointment(appointment.id),
    onSuccess: (data) => {
      setClaimFeedback({ tone: "success", message: "Appointment claimed. You can continue the job from this screen." });
      queryClient.setQueryData(["appointment", appointment.id, "assignment"], data);
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
      queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id, "assignment"] });
      void assignmentQuery.refetch();
    },
    onError: (err: Error) => {
      setClaimFeedback(getClaimFeedback(err));
    },
  });

  const assignment = assignmentQuery.data;
  const assignmentErrorText = assignmentQuery.error ? `${assignmentQuery.error}`.toLowerCase() : "";
  const assignmentState: ProviderAssignmentState = assignment
    ? assignment.user_id === userId
      ? { kind: "assigned_to_me", message: `Assigned${assignment.provider_name ? ` to ${assignment.provider_name}` : ""} (you).` }
      : { kind: "assigned_to_other", message: assignment.provider_name ? `Assigned to ${assignment.provider_name}.` : "Assigned to another provider." }
    : assignmentQuery.isError
      ? assignmentErrorText.includes("404")
        ? { kind: "unassigned", message: "No provider has claimed this appointment yet." }
        : { kind: "assignment_unavailable", message: "Assignment status is temporarily unavailable." }
      : { kind: "unassigned", message: "No provider has claimed this appointment yet." };
  const isUnassigned = assignmentState.kind === "unassigned";
  const assignedToMe = assignment?.user_id === userId;
  const showTravelCard = assignedToMe && (status === "en_route_pickup" || status === "out_for_delivery");
  const recommendedNextStatus = getRecommendedNextStatus(status);
  const secondaryStatuses = statusOptions.filter((opt) => opt !== status && opt !== recommendedNextStatus);
  const isUpdating = statusMutation.isPending || readyMutation.isPending;
  const timelineItems = useMemo(() => buildProviderTimeline(status), [status]);

  useFocusedAutoRefresh({
    enabled: true,
    intervalMs: isLiveAppointment ? 12000 : null,
    onRefresh: () => {
      void assignmentQuery.refetch();
      void queryClient.refetchQueries({ queryKey: ["provider", "open"], type: "active" });
      void queryClient.refetchQueries({ queryKey: ["provider", "my"], type: "active" });
    },
  });

  const info = useMemo(
    () => [
      { label: "Customer", value: appointment.customer_name ?? "Customer" },
      { label: "Service", value: appointment.service_name ?? "Appointment" },
      { label: "Category", value: appointment.category_name ?? "Care service" },
      { label: "Start", value: new Date(appointment.start_time).toLocaleString() },
      { label: "Location", value: [appointment.city ?? appointment.customer_city, appointment.state ?? appointment.customer_state].filter(Boolean).join(", ") || "Address pending" },
    ],
    [appointment],
  );

  const openReadyCaptureFlow = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

    if (!cameraPermission.granted) {
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert("Permission needed", "Camera permission is required to mark as ready.");
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!picked.canceled && picked.assets.length > 0) {
        setPendingReadyPhotoUri(picked.assets[0].uri);
      }
      return;
    }

    const captured = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!captured.canceled && captured.assets.length > 0) {
      setPendingReadyPhotoUri(captured.assets[0].uri);
    }
  };

  const handleStatusPress = async (next: AppointmentStatus) => {
    if (isUpdating) return;
    if (next === "ready") {
      await openReadyCaptureFlow();
      return;
    }
    statusMutation.mutate(next);
  };

  return (
    <>
      <AppScreen scrollable contentContainerStyle={styles.container}>
        <AppCard
          variant="marketplace"
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primaryPressed,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" weight="bold" color={theme.colors.accentSoft}>
                Provider job
              </Text>
              <Text variant="h1" weight="bold" style={[styles.heroTitle, { color: theme.colors.surfaceElevated }]}>
                {appointment.service_name ?? "Appointment"}
              </Text>
            </View>
            <View style={styles.heroBadges}>
              {appointment.category_name ? <StatusBadge label={appointment.category_name} tone="neutral" /> : null}
              <AppointmentStatusBadge status={status} />
            </View>
          </View>
          <Text color={theme.colors.accentSoft}>
            {appointment.customer_name ?? "Customer"} · {new Date(appointment.start_time).toLocaleString()}
          </Text>
        </AppCard>

        <AppCard variant="marketplace">
          <SectionHeader
            title="Recommended next action"
            subtitle={recommendedNextStatus ? `Move this job to ${getReadableAppointmentStatus(recommendedNextStatus)}.` : "This job is in a terminal or manually managed state."}
          />
          {recommendedNextStatus ? (
            <View style={styles.primaryAction}>
              <StatusBadge label="Next step" tone="primary" />
              {recommendedNextStatus === "ready" ? (
                <Text color={theme.colors.textSecondary} style={styles.actionCopy}>
                  Marking ready requires a completion photo.
                </Text>
              ) : null}
              <AppButton
                label={getReadableAppointmentStatus(recommendedNextStatus)}
                onPress={() => {
                  void handleStatusPress(recommendedNextStatus);
                }}
                disabled={isUpdating}
                loading={isUpdating}
                style={styles.actionButton}
              />
            </View>
          ) : null}
        </AppCard>

        <AppCard variant="marketplace">
          <SectionHeader title="Assignment" />
          {assignmentQuery.isFetching ? (
            <LoadingState label="Checking assignment" />
          ) : (
            <View style={styles.assignmentRow}>
              <View style={[styles.assignmentIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name={assignedToMe ? "checkmark-circle-outline" : "person-circle-outline"} size={24} color={assignedToMe ? theme.colors.success : theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="bold">{assignmentState.message}</Text>
                {assignmentState.kind === "assigned_to_other" ? (
                  <Text variant="caption" color={theme.colors.textMuted} style={styles.actionCopy}>
                    Reassignment is handled separately from normal job progress updates.
                  </Text>
                ) : null}
              </View>
            </View>
          )}
          {isUnassigned ? (
            <AppButton label={claimMutation.isPending ? "Claiming..." : "Claim appointment"} onPress={() => claimMutation.mutate()} loading={claimMutation.isPending} disabled={claimMutation.isPending} style={styles.claimButton} />
          ) : null}
          {claimFeedback ? (
            <View
              style={[
                styles.feedback,
                {
                  backgroundColor:
                    claimFeedback.tone === "success" ? `${theme.colors.success}12` : claimFeedback.tone === "warning" ? `${theme.colors.warning}14` : `${theme.colors.danger}12`,
                  borderColor:
                    claimFeedback.tone === "success" ? `${theme.colors.success}33` : claimFeedback.tone === "warning" ? `${theme.colors.warning}33` : `${theme.colors.danger}33`,
                },
              ]}
            >
              <Text variant="caption" weight="bold" color={claimFeedback.tone === "danger" ? theme.colors.danger : theme.colors.textPrimary}>
                {claimFeedback.message}
              </Text>
            </View>
          ) : null}
        </AppCard>

        <AppCard variant="marketplace">
          <SectionHeader title="Progress timeline" subtitle="Provider-facing job progression." />
          <AppointmentTimeline items={timelineItems} style={styles.timeline} />
        </AppCard>

        <AppCard variant="marketplace">
          <SectionHeader title="Other status updates" subtitle="Use these when the operational path needs a manual adjustment." />
          <View style={styles.secondaryGrid}>
            {secondaryStatuses.map((opt) => (
              <AppButton
                key={opt}
                label={getReadableAppointmentStatus(opt)}
                variant={opt === "cancelled" ? "destructive" : "secondary"}
                size="compact"
                onPress={() => {
                  void handleStatusPress(opt);
                }}
                disabled={isUpdating}
                style={styles.secondaryButton}
              />
            ))}
          </View>
        </AppCard>

        {showTravelCard ? <TravelMapCard appointment={{ ...appointment, status }} /> : null}

        <AppCard variant="marketplace">
          <SectionHeader title="Pickup and drop-off details" />
          <View style={styles.detailRows}>
            {info.map((item) => (
              <Row key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
        </AppCard>
      </AppScreen>

      <Modal visible={!!pendingReadyPhotoUri} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <AppCard variant="elevated" style={styles.modalCard}>
            <SectionHeader title="Preview completion photo" />
            {pendingReadyPhotoUri ? <Image source={{ uri: pendingReadyPhotoUri }} style={styles.previewImage} /> : null}
            <View style={styles.modalActions}>
              <AppButton label="Retake" variant="secondary" onPress={() => void openReadyCaptureFlow()} disabled={readyMutation.isPending} style={styles.modalButton} />
              <AppButton label={readyMutation.isPending ? "Uploading..." : "Confirm"} onPress={() => pendingReadyPhotoUri && readyMutation.mutate(pendingReadyPhotoUri)} loading={readyMutation.isPending} style={styles.modalButton} />
            </View>
            <AppButton label="Cancel" variant="ghost" onPress={() => setPendingReadyPhotoUri(null)} disabled={readyMutation.isPending} />
          </AppCard>
        </View>
      </Modal>
    </>
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
    paddingBottom: 40,
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
  primaryAction: {
    marginTop: 12,
    gap: 10,
  },
  actionCopy: {
    marginTop: 4,
  },
  actionButton: {
    marginTop: 2,
  },
  assignmentRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assignmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  claimButton: {
    marginTop: 14,
  },
  feedback: {
    marginTop: 12,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
  },
  timeline: {
    marginTop: 12,
  },
  secondaryGrid: {
    marginTop: 12,
    gap: 10,
  },
  secondaryButton: {
    alignSelf: "stretch",
  },
  detailRows: {
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    gap: 12,
  },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
});
