import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { updateAppointmentStatus } from "../../api/http";
import { CompanyStackParamList } from "../../navigation/CompanyStack";
import type { AppointmentStatus } from "../../types/company";

const statusOptions: AppointmentStatus[] = [
  "confirmed",
  "picked_up",
  "cleaning",
  "ready",
  "delivered",
  "completed",
  "cancelled",
];

type Props = NativeStackScreenProps<CompanyStackParamList, "ProviderAppointmentDetail">;

export default function ProviderAppointmentDetailScreen({ route }: Props) {
  const { appointment } = route.params;
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);

  const mutation = useMutation({
    mutationFn: (next: AppointmentStatus) =>
      updateAppointmentStatus(appointment.id, {
        status: next,
        confirmed_time: next === "confirmed" ? new Date().toISOString() : undefined,
      }),
    onSuccess: (_, next) => setStatus(next),
  });

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Appointment details</Text>
          {info.map((item) => (
            <View style={styles.row} key={item.label}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>Current status</Text>
            <Text style={styles.value}>{status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Update status</Text>
          {statusOptions.map((opt) => (
            <Pressable
              key={opt}
              style={[styles.button, status === opt && styles.buttonActive, mutation.isPending && styles.buttonDisabled]}
              disabled={mutation.isPending}
              onPress={() => mutation.mutate(opt)}
            >
              {mutation.isPending && status !== opt ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, status === opt && styles.buttonTextActive]}>{opt}</Text>
              )}
            </Pressable>
          ))}
          {mutation.isError ? <Text style={styles.error}>Failed to update</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { padding: 20, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#4b5563" },
  value: { fontWeight: "600" },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  buttonActive: { backgroundColor: "#16a34a" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonTextActive: { color: "#fff" },
  error: { color: "#b91c1c", marginTop: 8 },
});
