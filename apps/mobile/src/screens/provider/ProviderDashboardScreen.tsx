import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppointmentCard } from "../../components/AppointmentCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { appointments } from "../../data/mock";
import type { ProviderStackParamList } from "../../navigation/RootTabs";
import type { Appointment } from "../../types/models";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const filters = ["confirmed", "in_progress", "completed"] as const;

type Filter = (typeof filters)[number];

export default function ProviderDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const [online, setOnline] = useState(true);
  const [filter, setFilter] = useState<Filter>("confirmed");
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return appointments
      .filter((apt) => apt.status === filter)
      .map((apt) => ({ ...apt, claimedByMe: claimedIds.includes(apt.id) }));
  }, [filter, claimedIds]);

  const onClaim = (appointment: Appointment) => {
    setClaimedIds((ids) => [...ids, appointment.id]);
    navigation.navigate("ProviderAppointmentDetail", { appointment: { ...appointment, claimedByMe: true } });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Available Appointments</Text>
          <Text style={styles.subtitle}>{online ? "Online" : "Offline"}</Text>
        </View>
        <Switch value={online} onValueChange={setOnline} thumbColor="#0F4C5C" trackColor={{ true: "#1B998B", false: "#E5E7EB" }} />
      </View>
      <View style={styles.filterRow}>
        {filters.map((key) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{key.replace("_", " ")}</Text>
          </Pressable>
        ))}
      </View>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No appointments available</Text>
          <Text style={styles.emptySubtitle}>Check back soon for new bookings.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onClaim={onClaim}
              onPress={(appt) => navigation.navigate("ProviderAppointmentDetail", { appointment: appt })}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2933",
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#0F4C5C",
  },
  filterText: {
    color: "#4B5563",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#F8F9FA",
  },
  empty: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2933",
  },
  emptySubtitle: {
    color: "#6B7280",
    marginTop: 6,
  },
});
