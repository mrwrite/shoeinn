import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyAppointments } from "../../api/http";
import type { CustomerStackParamList } from "../../navigation/CustomerStack";
import type { AppointmentSummary } from "../../types/booking";
import { useAuthStore } from "../../state/authStore";

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const statusColors: Record<string, string> = {
  requested: "#e0f2fe",
  confirmed: "#dcfce7",
  en_route_pickup: "#dbeafe",
  picked_up: "#ede9fe",
  out_for_delivery: "#dbeafe",
  delivered: "#fef9c3",
  completed: "#e5e7eb",
  cleaning: "#f3e8ff",
  ready: "#cffafe",
  cancelled: "#fee2e2",
};

const statusTextColors: Record<string, string> = {
  requested: "#075985",
  confirmed: "#166534",
  en_route_pickup: "#1d4ed8",
  picked_up: "#7c3aed",
  out_for_delivery: "#2563eb",
  delivered: "#854d0e",
  completed: "#374151",
  cleaning: "#6b21a8",
  ready: "#0f766e",
  cancelled: "#b91c1c",
};

type Props = NativeStackScreenProps<CustomerStackParamList, "MyAppointments">;

export default function MyAppointmentsScreen({ navigation }: Props) {
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: getMyAppointments,
  });

  const renderItem = ({ item }: { item: AppointmentSummary }) => {
    const bg = statusColors[item.status] ?? "#e5e7eb";
    const fg = statusTextColors[item.status] ?? "#111827";
    return (
      <Pressable
        onPress={() => navigation.navigate("AppointmentDetail", { appointmentId: item.id, summary: item })}
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.cardTitle}>{item.service_name ?? "Appointment"}</Text>
            <Text style={styles.cardMeta}>{formatDateTime(item.start_time)}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: bg }]}>
            <Text style={[styles.statusText, { color: fg }]}>{item.status.replace(/_/g, " ")}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My appointments</Text>
          <Text style={styles.headerSubtitle}>Track and review your bookings</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate("CompanyPicker")} style={styles.linkButton}>
            <Text style={styles.linkText}>Book new</Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.linkButton} accessibilityLabel="Logout">
            <Text style={styles.linkText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text style={styles.error}>Failed to load appointments</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.empty}>You have no appointments yet.</Text>
              <Pressable
                style={[styles.primaryButton, styles.mt8]}
                onPress={() => navigation.navigate("CompanyPicker")}
              >
                <Text style={styles.primaryText}>Schedule one now</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSubtitle: { color: "#6b7280", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 12 },
  linkButton: { paddingHorizontal: 8, paddingVertical: 6 },
  linkText: { color: "#1d4ed8", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#b91c1c", paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardMeta: { color: "#4b5563", marginTop: 4 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontWeight: "700", textTransform: "capitalize" },
  emptyWrapper: { alignItems: "center", paddingVertical: 40, gap: 10 },
  empty: { textAlign: "center", color: "#6b7280" },
  primaryButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  mt8: { marginTop: 8 },
});
