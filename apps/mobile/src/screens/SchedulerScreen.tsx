import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { createHold, getAvailability } from "../api/http";
import { useBooking } from "../state/bookingStore";
import { useCompanyStore } from "../state/companyStore";

interface Props {
  onHoldCreated: () => void;
  onBack: () => void;
}

const SchedulerScreen: React.FC<Props> = ({ onHoldCreated, onBack }) => {
  const {
    selectedService,
    selectedDate,
    setHold,
    setStartTime,
  } = useBooking();
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [creating, setCreating] = React.useState(false);

  const availabilityQuery = useQuery<string[], Error>(
    {
      queryKey: ["availability", selectedService?.id, selectedDate],
      queryFn: () =>
        getAvailability(selectedService!.id, selectedDate!),
      enabled: Boolean(selectedService && selectedDate),
    },
  );

  const slots = availabilityQuery.data ?? [];

  const handleSelect = async (slot: string) => {
    if (!selectedService || !selectedDate) {
      return;
    }
    setCreating(true);
    try {
      const hold = await createHold({
        service_id: selectedService.id,
        start_time: slot,
        company_id: selectedCompany?.id,
      });
      setHold(hold);
      setStartTime(slot);
      console.log("[Booking] Hold created", hold.id);
      onHoldCreated();
    } catch (error: any) {
      console.warn("[Booking] Hold creation failed", error);
      Alert.alert("Hold failed", error?.message ?? "Unable to create hold");
    } finally {
      setCreating(false);
    }
  };

  if (availabilityQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (availabilityQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Unable to load availability.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => availabilityQuery.refetch()}>
          <Text style={styles.secondaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>← Choose date</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Select a time</Text>
      {slots.length === 0 ? (
        <Text style={styles.empty}>No availability for this date. Choose another day.</Text>
      ) : (
        <View style={styles.slotGrid}>
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slot, creating && styles.disabledButton]}
              onPress={() => handleSelect(slot)}
              disabled={creating}
              accessibilityRole="button"
            >
              <Text style={styles.slotText}>{new Date(slot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.secondaryButton} onPress={onBack} accessibilityRole="button">
        <Text style={styles.secondaryText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SchedulerScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  back: {
    color: "#2563eb",
    fontWeight: "600",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  slot: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  slotText: {
    color: "#f9fafb",
    fontWeight: "600",
  },
  empty: {
    fontSize: 16,
    color: "#6b7280",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
