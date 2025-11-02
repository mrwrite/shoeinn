import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { confirmAppointment } from "../api/http";
import { useBooking } from "../state/bookingStore";

interface Props {
  onConfirmed: () => void;
  onBack: () => void;
}

const CustomerInfoScreen: React.FC<Props> = ({ onConfirmed, onBack }) => {
  const { hold, setAppointment } = useBooking();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!hold || !name || !phone) {
      return;
    }
    setSubmitting(true);
    try {
      const appointment = await confirmAppointment({
        hold_id: hold.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        idempotencyKey: `app-${Date.now()}`,
      });
      console.log("[Booking] Appointment confirmed", appointment.id);
      setAppointment(appointment);
      onConfirmed();
    } catch (error: any) {
      console.warn("[Booking] Confirmation failed", error);
      Alert.alert("Confirmation failed", error?.message ?? "Unable to confirm appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hold) {
    return (
      <View style={styles.center}>
        <Text>No hold found. Please start over.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const disabled = submitting || !name || !phone;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>← Choose another time</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Your details</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        accessibilityLabel="Full name"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        accessibilityLabel="Phone number"
      />
      <TextInput
        style={styles.input}
        placeholder="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email"
      />
      <TouchableOpacity
        style={[styles.primaryButton, disabled && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={disabled}
        accessibilityRole="button"
      >
        {submitting ? (
          <ActivityIndicator color="#f9fafb" />
        ) : (
          <Text style={styles.buttonText}>Confirm appointment</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default CustomerInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
});
