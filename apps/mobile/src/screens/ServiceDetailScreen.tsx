import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Service } from "../types/booking";

interface Props {
  service: Service;
  selectedDate?: string;
  onSelectDate: (date: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

function upcomingDates(days = 7): string[] {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() + index);
    return d.toISOString().split("T")[0];
  });
}

const ServiceDetailScreen: React.FC<Props> = ({
  service,
  selectedDate,
  onSelectDate,
  onContinue,
  onBack,
}) => {
  const dates = React.useMemo(() => upcomingDates(7), []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>← All services</Text>
      </TouchableOpacity>
      <Text style={styles.name}>{(service?.name ?? "").toUpperCase()}</Text>
      {service.description ? <Text style={styles.description}>{service.description}</Text> : null}
      <Text style={styles.meta}>Duration: {service.duration_minutes} minutes</Text>
      <Text style={styles.meta}>Price: ${(service.price_cents / 100).toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Select a date</Text>
      <View style={styles.datesRow}>
        {dates.map((date) => {
          const isSelected = date === selectedDate;
          return (
            <TouchableOpacity
              key={date}
              style={[styles.datePill, isSelected && styles.dateSelected]}
              onPress={() => onSelectDate(date)}
              accessibilityRole="button"
            >
              <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{date}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !selectedDate && styles.disabledButton]}
        disabled={!selectedDate}
        onPress={onContinue}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>See availability</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ServiceDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  back: {
    color: "#2563eb",
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
  },
  description: {
    fontSize: 16,
    color: "#4b5563",
  },
  meta: {
    fontSize: 15,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  datesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  datePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dateSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  dateText: {
    color: "#111827",
    fontWeight: "600",
  },
  dateTextSelected: {
    color: "#f9fafb",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#1f2937",
    paddingVertical: 14,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.4,
  },
  buttonText: {
    textAlign: "center",
    color: "#f9fafb",
    fontWeight: "700",
    fontSize: 16,
  },
});
