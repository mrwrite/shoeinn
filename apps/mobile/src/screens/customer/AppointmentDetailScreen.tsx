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
import type { AppointmentStackParamList } from "../../navigation/types";
import type {
  AppointmentEvent,
  AppointmentSummary,
} from "../../types/booking";
import { CustomerTravelMapCard } from "../../components/CustomerTravelMapCard";

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

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const StatusRow = ({ label, active }: { label: string; active: boolean }) => (
  <View style={styles.statusRow}>
    <View style={[styles.statusDot, active && styles.statusDotActive]} />
    <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>
      {label}
    </Text>
  </View>
);

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
  return statusOrder.map((status) => ({ status, active: reached.has(status) }));
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
            detail: "We are still working on assigning your appointment.",
          }
        : {
            kind: "assignment_unavailable",
            title: "Provider status unavailable",
            detail: "We could not load provider assignment right now.",
          }
      : {
          kind: "unassigned",
          title: "Checking provider assignment",
          detail: "Assignment information is loading.",
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
    completed: "This appointment is complete.",
    cancelled: "This appointment was cancelled.",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {!appointment ? (
          <View style={styles.center}>
            {appointmentQuery.isLoading ? (
              <ActivityIndicator />
            ) : (
              <Text>Appointment not found</Text>
            )}
          </View>
        ) : (
          <>
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
              <Text style={styles.title}>
                {appointment?.service_name ?? "Appointment"}
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
                  {nextStepCopy[appointment.status] ?? "We will keep this status updated as your appointment moves forward."}
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

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Status timeline</Text>
              {eventsQuery.isLoading ? <ActivityIndicator style={{ marginTop: 8, marginBottom: 8 }} /> : null}
              {statusHistory.map((item) => (
                <StatusRow
                  key={item.status}
                  label={statusLabels[item.status] ?? item.status}
                  active={item.active}
                />
              ))}
            </View>

            {shouldShowFinishedPhotoSection ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Finished Photo</Text>
                {finishedPhotoUrl ? (
                  <Pressable
                    onPress={() => setExpandedPhotoUrl(finishedPhotoUrl)}
                  >
                    <Image
                      source={{ uri: finishedPhotoUrl }}
                      style={styles.finishedPhoto}
                    />
                    <Text style={styles.meta}>Tap to expand</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.meta}>Photo pending</Text>
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
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
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { fontWeight: "700", textTransform: "capitalize" },
  summaryBlock: {
    marginTop: 8,
    gap: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  label: { color: "#6b7280", marginTop: 4 },
  value: { fontSize: 16, fontWeight: "600" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  statusDotActive: { backgroundColor: "#22c55e" },
  statusLabel: { color: "#6b7280" },
  statusLabelActive: { color: "#111827", fontWeight: "700" },
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
