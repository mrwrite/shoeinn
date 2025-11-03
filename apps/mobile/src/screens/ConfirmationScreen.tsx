import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useBooking } from "../state/bookingStore";

interface Props {
  onDone: () => void;
}

const ConfirmationScreen: React.FC<Props> = ({ onDone }) => {
  const { appointment, selectedService } = useBooking();

  if (!appointment || !selectedService) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Booking complete</Text>
        <Text style={styles.subtitle}>Thanks! You can start a new booking.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onDone} accessibilityRole="button">
          <Text style={styles.buttonText}>Book again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const start = new Date(appointment.start_time).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const end = new Date(appointment.end_time).toLocaleTimeString(undefined, {
    timeStyle: "short",
  });

  const paymentStatus = appointment.payment_status ?? "pending";
  const paymentLabel = (() => {
    switch (paymentStatus) {
      case "succeeded":
        return "Payment status: Confirmed";
      case "failed":
        return "Payment status: Action needed";
      default:
        return "Payment status: Pending";
    }
  })();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're booked!</Text>
      <Text style={styles.subtitle}>We'll send a reminder shortly.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{(selectedService.name ?? "").toUpperCase()}</Text>
        <Text style={styles.cardText}>When: {start} – {end}</Text>
        <Text style={styles.cardText}>Name: {appointment.customer_name}</Text>
        <Text style={styles.cardText}>Phone: {appointment.customer_phone}</Text>
        {appointment.customer_email ? (
          <Text style={styles.cardText}>Email: {appointment.customer_email}</Text>
        ) : null}
        <Text style={[styles.cardText, paymentStatus !== "succeeded" && styles.warningText]}>{paymentLabel}</Text>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onDone} accessibilityRole="button">
        <Text style={styles.buttonText}>Book another cleaning</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  card: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: "#e5e7eb",
    fontSize: 15,
  },
  warningText: {
    color: "#fbbf24",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "700",
    fontSize: 16,
  },
});
