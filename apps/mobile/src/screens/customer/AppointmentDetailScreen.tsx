import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  API_URL,
  getAppointment,
  getAppointmentAssignment,
  getAppointmentEvents,
} from "../../api/http";
import { CustomerTravelMapCard } from "../../components/CustomerTravelMapCard";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import type { AppointmentStackParamList } from "../../navigation/types";
import type {
  AppointmentEvent,
  AppointmentSummary,
} from "../../types/booking";

const travelStatuses = new Set(["en_route_pickup", "out_for_delivery"]);
const photoVisibleStatuses = new Set(["ready", "out_for_delivery", "delivered", "completed"]);

const statusLabels: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  en_route_pickup: "En route to pickup",
  picked_up: "Picked up",
  cleaning: "Cleaning",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusOrder = [
  "requested",
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

type Props = NativeStackScreenProps<
  AppointmentStackParamList,
  "AppointmentDetail"
>;

type CustomerAssignmentState =
  | { kind: "assigned"; title: string; detail?: string }
  | { kind: "unassigned"; title: string; detail?: string }
  | { kind: "assignment_unavailable"; title: string; detail?: string };

type TimelineState = "current" | "completed" | "upcoming" | "terminal";

const timelineDescriptions: Record<TimelineState, string> = {
  current: "This is what is happening right now.",
  completed: "Finished",
  upcoming: "Coming up next",
  terminal: "Final outcome",
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const buildStatusHistory = (
  events: AppointmentEvent[],
  currentStatus?: string
) => {
  const reached = new Set<string>();
  events.forEach((event) => {
    if (event.kind === "status_change" && event.payload?.status) {
      reached.add(event.payload.status as string);
    }
  });
  if (currentStatus) {
    reached.add(currentStatus);
  }

  const currentIndex = currentStatus ? statusOrder.indexOf(currentStatus) : -1;
  const isTerminal = currentStatus === "completed" || currentStatus === "cancelled";

  return statusOrder
    .filter((status) => {
      if (currentStatus === "cancelled") {
        return reached.has(status) || status === "cancelled";
      }
      return status !== "cancelled";
    })
    .map((status, index) => {
      let state: TimelineState = "upcoming";

      if (status === currentStatus && (status === "completed" || status === "cancelled")) {
        state = "terminal";
      } else if (status === currentStatus) {
        state = "current";
      } else if (reached.has(status) && currentIndex >= 0 && index < currentIndex) {
        state = "completed";
      } else if (isTerminal && reached.has(status) && status !== currentStatus) {
        state = "completed";
      }

      return { status, state };
    });
};

const resolvePhotoUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_URL.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function AppointmentDetailScreen({ route }: Props) {
  const { appointmentId, summary } = route.params;
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

  const appointmentQuery = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getAppointment(appointmentId),
  });

  const eventsQuery = useQuery({
    queryKey: ["appointment", appointmentId, "events"],
    queryFn: () => getAppointmentEvents(appointmentId),
    enabled: !!appointmentId,
  });

  const assignmentQuery = useQuery({
    queryKey: ["appointment", appointmentId, "assignment"],
    queryFn: () => getAppointmentAssignment(appointmentId),
    retry: false,
  });

  const status = appointmentQuery.data?.status ?? summary?.status;
  const shouldShowTravelMap = status ? travelStatuses.has(status) : false;

  const appointment =
    appointmentQuery.data ?? (summary as AppointmentSummary | undefined);
  const statusHistory = useMemo(
    () => buildStatusHistory(eventsQuery.data ?? [], appointment?.status),
    [eventsQuery.data, appointment?.status]
  );

  const finishedPhotoUrl = resolvePhotoUrl(appointmentQuery.data?.ready_photo_url);
  const shouldShowFinishedPhotoSection = appointment ? photoVisibleStatuses.has(appointment.status) : false;
  const assignmentErrorText = assignmentQuery.error ? `${assignmentQuery.error}`.toLowerCase() : "";
  const assignmentState: CustomerAssignmentState = assignmentQuery.data
    ? {
        kind: "assigned",
        title: assignmentQuery.data.provider_name ?? "Provider assigned",
        detail: `Assigned at ${formatDateTime(assignmentQuery.data.assigned_at)}`,
      }
    : assignmentQuery.isError
      ? assignmentErrorText.includes("404")
        ? {
            kind: "unassigned",
            title: "No provider assigned yet",
            detail: "We’re still matching your appointment with a provider.",
          }
        : {
            kind: "assignment_unavailable",
            title: "Provider status temporarily unavailable",
            detail: "Your appointment is still active, but we could not load provider assignment right now.",
          }
      : {
          kind: "unassigned",
          title: "Checking provider assignment",
          detail: "We’re loading the latest assignment details.",
        };
  const currentStatusLabel = appointment
    ? statusLabels[appointment.status] ?? appointment.status
    : "Appointment";
  const nextStepCopy: Record<string, string> = {
    requested: "Your appointment request has been received.",
    confirmed: "A provider can now prepare for pickup.",
    en_route_pickup: "Your provider is on the way to pick up your order.",
    picked_up: "Your items are with the provider.",
    cleaning: "Your items are currently being cleaned.",
    ready: "Your order is ready for delivery.",
    out_for_delivery: "Your provider is bringing your order back to you.",
    delivered: "Your order has been delivered.",
    completed: "Everything for this appointment is complete.",
    cancelled: "This appointment was cancelled.",
  };
  const isAppointmentLoading = appointmentQuery.isLoading && !appointment;
  const isLiveAppointment =
    !!appointment && !["completed", "cancelled"].includes(appointment.status);

  useFocusedAutoRefresh({
    enabled: !!appointmentId,
    intervalMs: isLiveAppointment ? 12000 : null,
    onRefresh: () => {
      void appointmentQuery.refetch();
      void assignmentQuery.refetch();
      void eventsQuery.refetch();
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {!appointment ? (
          <View style={styles.stateCard}>
            {isAppointmentLoading ? <ActivityIndicator /> : null}
            <Text style={styles.sectionTitle}>
              {isAppointmentLoading ? "Loading your appointment" : "Appointment not found"}
            </Text>
            <Text style={styles.meta}>
              {isAppointmentLoading
                ? "We’re pulling together the latest appointment details for you."
                : "We couldn’t find this appointment in the active customer flow."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.title}>
                {appointment.service_name ?? "Appointment"}
              </Text>
              <Text style={styles.meta}>
                {formatDateTime(appointment.start_time)}
              </Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {statusLabels[appointment.status] ?? appointment.status}
                </Text>
              </View>
              <View style={styles.summaryBlock}>
                <Text style={styles.sectionTitle}>Current status</Text>
                <Text style={styles.value}>{currentStatusLabel}</Text>
                <Text style={styles.meta}>
                  {nextStepCopy[appointment.status] ?? "We’ll keep this status updated as your appointment moves forward."}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Provider</Text>
              <Text style={styles.value}>{assignmentState.title}</Text>
              {assignmentState.detail ? (
                <Text style={styles.meta}>{assignmentState.detail}</Text>
              ) : null}
            </View>

            {shouldShowTravelMap ? (
              <CustomerTravelMapCard
                appointment={{
                  id: appointment.id,
                  status: appointment.status,
                  address_line1: appointment.address_line1,
                  address_line2: appointment.address_line2,
                  city: appointment.city,
                  state: appointment.state,
                  postal_code: appointment.postal_code,
                }}
              />
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <Text style={styles.meta}>Follow what has already happened, what is active now, and what comes next.</Text>
              {eventsQuery.isLoading ? (
                <View style={styles.timelineState}>
                  <ActivityIndicator />
                  <Text style={styles.meta}>We’re loading the latest progress history.</Text>
                </View>
              ) : eventsQuery.isError ? (
                <View style={styles.timelineState}>
                  <Text style={styles.meta}>
                    Progress history is temporarily unavailable. Your current status summary above is still up to date.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {statusHistory.map((item, index) => (
                    <View key={item.status} style={styles.timelineEntry}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.statusDot,
                            item.state === "current" && styles.statusDotCurrent,
                            item.state === "completed" && styles.statusDotCompleted,
                            item.state === "upcoming" && styles.statusDotUpcoming,
                            item.state === "terminal" && styles.statusDotTerminal,
                          ]}
                        />
                        {index < statusHistory.length - 1 ? (
                          <View
                            style={[
                              styles.timelineLine,
                              item.state === "completed" && styles.timelineLineCompleted,
                              item.state === "current" && styles.timelineLineCurrent,
                            ]}
                          />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.statusRow,
                          item.state === "current" && styles.statusRowCurrent,
                          item.state === "completed" && styles.statusRowCompleted,
                          item.state === "upcoming" && styles.statusRowUpcoming,
                          item.state === "terminal" && styles.statusRowTerminal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusLabel,
                            item.state === "current" && styles.statusLabelCurrent,
                            item.state === "completed" && styles.statusLabelCompleted,
                            item.state === "terminal" && styles.statusLabelTerminal,
                          ]}
                        >
                          {statusLabels[item.status] ?? item.status}
                        </Text>
                        <Text style={styles.statusMeta}>
                          {timelineDescriptions[item.state]}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {shouldShowFinishedPhotoSection ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Finished photo</Text>
                {finishedPhotoUrl ? (
                  <Pressable onPress={() => setExpandedPhotoUrl(finishedPhotoUrl)}>
                    <Image
                      source={{ uri: finishedPhotoUrl }}
                      style={styles.finishedPhoto}
                    />
                    <Text style={styles.meta}>Tap to expand</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.meta}>A completion photo is expected here once it is available.</Text>
                )}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Details</Text>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{appointment.customer_name}</Text>
              <Text style={styles.label}>Contact</Text>
              <Text style={styles.value}>{appointment.customer_phone}</Text>
              {appointment.address_line1 ? (
                <>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>
                    {[appointment.address_line1, appointment.address_line2]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                  <Text style={styles.meta}>
                    {[
                      appointment.city,
                      appointment.state,
                      appointment.postal_code,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!expandedPhotoUrl} transparent animationType="fade">
        <Pressable
          style={styles.photoModalBackdrop}
          onPress={() => setExpandedPhotoUrl(null)}
        >
          {expandedPhotoUrl ? (
            <Image
              source={{ uri: expandedPhotoUrl }}
              style={styles.photoModalImage}
            />
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  heroCard: {
    backgroundColor: "#eff6ff",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "800" },
  meta: { color: "#6b7280" },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { fontWeight: "700", textTransform: "capitalize", color: "#1d4ed8" },
  summaryBlock: {
    marginTop: 4,
    gap: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  label: { color: "#6b7280", marginTop: 4 },
  value: { fontSize: 16, fontWeight: "600" },
  timelineList: {
    marginTop: 6,
    gap: 0,
  },
  timelineEntry: {
    flexDirection: "row",
    gap: 12,
  },
  timelineRail: {
    width: 16,
    alignItems: "center",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#e5e7eb",
    marginTop: 4,
  },
  timelineLineCompleted: {
    backgroundColor: "#86efac",
  },
  timelineLineCurrent: {
    backgroundColor: "#93c5fd",
  },
  statusRow: {
    flex: 1,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    backgroundColor: "#e5e7eb",
  },
  statusDotCurrent: { backgroundColor: "#0F4C5C" },
  statusDotCompleted: { backgroundColor: "#22c55e" },
  statusDotUpcoming: { backgroundColor: "#d1d5db" },
  statusDotTerminal: { backgroundColor: "#7c3aed" },
  statusRowCurrent: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
  statusRowCompleted: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },
  statusRowUpcoming: {
    backgroundColor: "#f8fafc",
    borderStyle: "dashed",
  },
  statusRowTerminal: {
    backgroundColor: "#faf5ff",
    borderColor: "#d8b4fe",
  },
  statusLabel: { color: "#6b7280", fontWeight: "600" },
  statusLabelCurrent: { color: "#111827", fontWeight: "700" },
  statusLabelCompleted: { color: "#166534", fontWeight: "700" },
  statusLabelTerminal: { color: "#5b21b6", fontWeight: "700" },
  statusMeta: {
    color: "#6b7280",
    marginTop: 4,
    fontSize: 12,
  },
  timelineState: {
    paddingVertical: 12,
    gap: 8,
  },
  finishedPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  photoModalImage: {
    width: "100%",
    height: "85%",
    resizeMode: "contain",
  },
});
