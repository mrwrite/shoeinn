import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Pressable,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAppointment,
  getAppointmentAssignment,
  getAppointmentEvents,
  getAppointmentLatestLocation,
} from "../../api/http";
import type { CustomerStackParamList } from "../../navigation/CustomerStack";
import type {
  AppointmentEvent,
  AppointmentLocationUpdate,
  AppointmentSummary,
} from "../../types/booking";

const travelStatuses = new Set([
  "en_route_pickup",
  "picked_up",
  "out_for_delivery",
]);

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
  CustomerStackParamList,
  "AppointmentDetail"
>;

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

const ProviderCard = ({
  providerName,
  assignedAt,
}: {
  providerName: string;
  assignedAt: string;
}) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>Assigned provider</Text>
    <Text style={styles.value}>{providerName}</Text>
    <Text style={styles.meta}>Assigned at {formatDateTime(assignedAt)}</Text>
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

const openGoogleNav = async (lat: number, lng: number) => {
  const url = `google.navigation:q=${lat},${lng}`;
  const can = await Linking.canOpenURL(url);
  if (can) return Linking.openURL(url);

  // Fallback to web map
  return Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  );
};

const openAppleMaps = (lat: number, lng: number) => {
  // Works on iOS; harmless on Android but likely won't open
  return Linking.openURL(`http://maps.apple.com/?q=${lat},${lng}`);
};

const openWebMap = (lat: number, lng: number) => {
  return Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  );
};

const TrackingActions = ({
  location,
}: {
  location: AppointmentLocationUpdate;
}) => {
  return (
    <View style={styles.trackingBox}>
      <Text style={styles.meta}>
        Last updated:{" "}
        {location.recorded_at ? formatDateTime(location.recorded_at) : "-"}
      </Text>

      <View style={styles.coordRow}>
        <Text style={styles.coordLabel}>Lat</Text>
        <Text style={styles.coordValue}>{location.lat.toFixed(5)}</Text>
      </View>
      <View style={styles.coordRow}>
        <Text style={styles.coordLabel}>Lng</Text>
        <Text style={styles.coordValue}>{location.lng.toFixed(5)}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => openGoogleNav(location.lat, location.lng)}
        >
          <Text style={styles.primaryBtnText}>Navigate (Google)</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => openWebMap(location.lat, location.lng)}
        >
          <Text style={styles.secondaryBtnText}>Open Map</Text>
        </Pressable>

        {/* Optional: show on iOS devices */}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => openAppleMaps(location.lat, location.lng)}
        >
          <Text style={styles.secondaryBtnText}>Apple Maps</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function AppointmentDetailScreen({ route }: Props) {
  const { appointmentId, summary } = route.params;

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
  const shouldPollLocation = status ? travelStatuses.has(status) : false;

  const locationQuery = useQuery({
    queryKey: ["appointment", appointmentId, "location"],
    queryFn: () => getAppointmentLatestLocation(appointmentId),
    enabled: shouldPollLocation,
    refetchInterval: shouldPollLocation ? 4000 : false,
    retry: false,
  });

  const appointment =
    appointmentQuery.data ?? (summary as AppointmentSummary | undefined);
  const statusHistory = useMemo(
    () => buildStatusHistory(eventsQuery.data ?? [], appointment?.status),
    [eventsQuery.data, appointment?.status]
  );

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
            </View>

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

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Status timeline</Text>
              {statusHistory.map((item) => (
                <StatusRow
                  key={item.status}
                  label={statusLabels[item.status] ?? item.status}
                  active={item.active}
                />
              ))}
            </View>

            {assignmentQuery.data ? (
              <ProviderCard
                providerName={assignmentQuery.data.provider_name ?? "Provider"}
                assignedAt={assignmentQuery.data.assigned_at}
              />
            ) : assignmentQuery.isError ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Provider</Text>
                <Text style={styles.meta}>Not yet assigned</Text>
              </View>
            ) : null}

            {shouldPollLocation ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Live location</Text>
                {locationQuery.isLoading ? (
                  <View style={styles.center}>
                    <ActivityIndicator />
                  </View>
                ) : locationQuery.data ? (
                  <TrackingActions location={locationQuery.data} />
                ) : (
                  <Text style={styles.meta}>Location unavailable</Text>
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
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
  trackingBox: { gap: 10 },
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  coordLabel: { color: "#6b7280", fontWeight: "700" },
  coordValue: { fontWeight: "700", color: "#111827" },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  primaryBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryBtnText: { color: "#111827", fontWeight: "800" },
});
