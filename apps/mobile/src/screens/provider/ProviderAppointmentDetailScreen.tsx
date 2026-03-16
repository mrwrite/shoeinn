import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

import {
  claimAppointment,
  getProviderAppointmentAssignment,
  setAppointmentReadyWithPhoto,
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

type ProviderAssignmentState =
  | { kind: "assigned_to_me"; message: string }
  | { kind: "assigned_to_other"; message: string }
  | { kind: "unassigned"; message: string }
  | { kind: "assignment_unavailable"; message: string };

type FeedbackTone = "success" | "warning" | "danger";

function getRecommendedNextStatus(status: AppointmentStatus): AppointmentStatus | null {
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

function getClaimFeedback(error: Error): { tone: FeedbackTone; message: string } {
  const message = error.message.toLowerCase();
  if (
    message.includes("already assigned") ||
    message.includes("conflict") ||
    message.includes("no longer available") ||
    message.includes("409")
  ) {
    return {
      tone: "warning",
      message: "This appointment is no longer available to claim.",
    };
  }

  return {
    tone: "danger",
    message: "Unable to claim this appointment right now. Try again shortly.",
  };
}

export default function ProviderAppointmentDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<ProviderStackParamList, "ProviderAppointmentDetail">>();
  const { appointment } = route.params;
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [pendingReadyPhotoUri, setPendingReadyPhotoUri] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{
    tone: FeedbackTone;
    message: string;
  } | null>(null);
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
      queryClient.invalidateQueries({ queryKey: ["provider", "my"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id] });
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
    },
    onError: (err: Error) => Alert.alert("Upload failed", err.message),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimAppointment(appointment.id),
    onSuccess: (data) => {
      setClaimFeedback({
        tone: "success",
        message: "Appointment claimed. You can continue the job from this screen.",
      });
      queryClient.setQueryData(["appointment", appointment.id, "assignment"], data);
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
    },
    onError: (err: Error) => {
      setClaimFeedback(getClaimFeedback(err));
    },
  });

  const assignment = assignmentQuery.data;
  const assignmentErrorText = assignmentQuery.error ? `${assignmentQuery.error}`.toLowerCase() : "";
  const assignmentState: ProviderAssignmentState = assignment
    ? assignment.user_id === userId
      ? {
          kind: "assigned_to_me",
          message: `Assigned${assignment.provider_name ? ` to ${assignment.provider_name}` : ""} (you).`,
        }
      : {
          kind: "assigned_to_other",
          message: assignment.provider_name
            ? `Assigned to ${assignment.provider_name}.`
            : "Assigned to another provider.",
        }
    : assignmentQuery.isError
      ? assignmentErrorText.includes("404")
        ? {
            kind: "unassigned",
            message: "No provider has claimed this appointment yet.",
          }
        : {
            kind: "assignment_unavailable",
            message: "Assignment status is temporarily unavailable.",
          }
      : {
          kind: "unassigned",
          message: "No provider has claimed this appointment yet.",
        };
  const isUnassigned = assignmentState.kind === "unassigned";
  const assignedToMe = assignment?.user_id === userId;
  const showTravelCard =
    assignedToMe && (status === "en_route_pickup" || status === "out_for_delivery");
  const recommendedNextStatus = getRecommendedNextStatus(status);
  const secondaryStatuses = statusOptions.filter(
    (opt) => opt !== status && opt !== recommendedNextStatus,
  );
  const currentStateLabel = status.replace(/_/g, " ");

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

  const openReadyCaptureFlow = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

    if (!cameraPermission.granted) {
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert("Permission needed", "Camera permission is required to mark as ready.");
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
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
    if (next === "ready") {
      await openReadyCaptureFlow();
      return;
    }
    statusMutation.mutate(next);
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.surfaceLight }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Text variant="title" weight="bold">
            {appointment.service_name ?? "Appointment"}
          </Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <View style={styles.stateHeader}>
              <View style={styles.stateBadge}>
                <Text variant="overline" weight="semibold" color={theme.colors.peacockPrimary}>
                  Current state
                </Text>
              </View>
              <Text variant="subtitle" weight="semibold">
                {currentStateLabel}
              </Text>
              <Text color={theme.colors.mutedText}>
                {recommendedNextStatus
                  ? `Next recommended update: ${recommendedNextStatus.replace(/_/g, " ")}.`
                  : "This appointment is in a terminal or manually managed state."}
              </Text>
            </View>

            {recommendedNextStatus ? (
              <View style={styles.primaryActionBlock}>
                <Text variant="subtitle" weight="semibold">
                  Primary next action
                </Text>
                {recommendedNextStatus === "ready" ? (
                  <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 4 }}>
                    Marking this appointment as ready requires a finished-shoes photo.
                  </Text>
                ) : null}
                <Button
                  label={recommendedNextStatus.replace(/_/g, " ")}
                  onPress={() => {
                    void handleStatusPress(recommendedNextStatus);
                  }}
                  disabled={statusMutation.isPending || readyMutation.isPending}
                  loading={statusMutation.isPending || readyMutation.isPending}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Assignment
          </Text>
          {assignmentQuery.isFetching ? (
            <ActivityIndicator color={theme.colors.peacockPrimary} style={{ marginTop: 10 }} />
          ) : (
            <Text style={{ marginTop: 8 }} color={theme.colors.mutedText}>
              {assignmentState.message}
            </Text>
          )}
          {assignmentState.kind === "assigned_to_other" ? (
            <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              Reassignment is handled separately from normal job progress updates.
            </Text>
          ) : null}
          {assignmentState.kind === "assignment_unavailable" ? (
            <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              Pull to refresh later if you need the latest assignment information.
            </Text>
          ) : null}
          {isUnassigned ? (
            <Button
              label={claimMutation.isPending ? "Claiming..." : "Claim appointment"}
              onPress={() => claimMutation.mutate()}
              loading={claimMutation.isPending}
              style={{ marginTop: 12 }}
            />
          ) : null}
          {claimFeedback ? (
            <View
              style={[
                styles.feedback,
                claimFeedback.tone === "success" && styles.feedbackSuccess,
                claimFeedback.tone === "warning" && styles.feedbackWarning,
                claimFeedback.tone === "danger" && styles.feedbackDanger,
              ]}
            >
              <Text
                variant="caption"
                weight="semibold"
                color={
                  claimFeedback.tone === "danger"
                    ? theme.colors.danger
                    : theme.colors.textCharcoal
                }
              >
                {claimFeedback.message}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Other updates
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {secondaryStatuses.map((opt) => (
              <Button
                key={opt}
                label={opt.replace(/_/g, " ")}
                variant="secondary"
                onPress={() => {
                  void handleStatusPress(opt);
                }}
                disabled={statusMutation.isPending || readyMutation.isPending}
                style={{ marginBottom: 8 }}
              />
            ))}
          </View>
        </Card>

        {showTravelCard ? <TravelMapCard appointment={{ ...appointment, status }} /> : null}

        <Card>
          <Text variant="subtitle" weight="semibold">
            Details
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {info.map((item) => (
              <Row key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
        </Card>
      </ScrollView>

      <Modal visible={!!pendingReadyPhotoUri} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <Text variant="subtitle" weight="semibold">Preview finished photo</Text>
            {pendingReadyPhotoUri ? <Image source={{ uri: pendingReadyPhotoUri }} style={styles.previewImage} /> : null}
            <View style={styles.modalActions}>
              <Button label="Retake" variant="secondary" onPress={() => void openReadyCaptureFlow()} disabled={readyMutation.isPending} />
              <Button
                label={readyMutation.isPending ? "Uploading..." : "Confirm"}
                onPress={() => pendingReadyPhotoUri && readyMutation.mutate(pendingReadyPhotoUri)}
                loading={readyMutation.isPending}
              />
            </View>
            <Button label="Cancel" variant="ghost" onPress={() => setPendingReadyPhotoUri(null)} disabled={readyMutation.isPending} />
          </Card>
        </View>
      </Modal>
    </>
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
    gap: 12,
  },
  stateHeader: {
    gap: 6,
  },
  stateBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#e0f2fe",
  },
  primaryActionBlock: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#eefbf8",
  },
  feedback: {
    marginTop: 12,
    borderRadius: 12,
    padding: 10,
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
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
});
