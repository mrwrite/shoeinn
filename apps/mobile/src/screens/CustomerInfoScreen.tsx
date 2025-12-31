import { useAuthStore } from "../state/authStore";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { confirmAppointment, getAppointment } from "../api/http";
import { useBooking } from "../state/bookingStore";
import { useCompanyStore } from "../state/companyStore";

interface Props {
  onConfirmed: () => void;
  onBack: () => void;
}

const CustomerInfoScreen: React.FC<Props> = ({ onConfirmed, onBack }) => {
  const fullName = useAuthStore((s) => s.fullName);
  const authEmail = useAuthStore((s) => s.email);

  React.useEffect(() => {
    if (fullName) setName(fullName);
    if (authEmail) setEmail(authEmail);
  }, [fullName, authEmail]);

  const nameLocked = Boolean(fullName);
  const emailLocked = Boolean(authEmail);

  const { hold, setAppointment } = useBooking();
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [polling, setPolling] = React.useState(false);

  const wait = React.useCallback(
    (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
    []
  );

  const pollPaymentStatus = React.useCallback(
    async (appointmentId: string) => {
      setPolling(true);
      try {
        const maxAttempts = 20;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          await wait(3000);
          const latest = await getAppointment(appointmentId);
          setAppointment(latest);
          const status = latest.payment_status ?? "pending";
          if (status === "succeeded") {
            onConfirmed();
            return;
          }
          if (status === "failed") {
            throw new Error("Payment failed. Please try again.");
          }
        }
        throw new Error("Timed out waiting for payment confirmation");
      } finally {
        setPolling(false);
      }
    },
    [onConfirmed, setAppointment, wait]
  );

  const handleSubmit = async () => {
    if (!hold || !name || !phone || !selectedCompany) {
      return;
    }
    setSubmitting(true);
    try {
      const appointment = await confirmAppointment({
        hold_id: hold.id,
        company_id: selectedCompany.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        idempotencyKey: `app-${Date.now()}`,
      });
      console.log("[Booking] Appointment created", appointment.id);
      setAppointment(appointment);

      const paymentStatus = appointment.payment_status ?? "pending";
      if (paymentStatus === "succeeded") {
        onConfirmed();
        return;
      }

      if (appointment.payment_checkout_url) {
        try {
          await Linking.openURL(appointment.payment_checkout_url);
        } catch (err) {
          console.warn("[Booking] Unable to open checkout", err);
        }
      }

      await pollPaymentStatus(appointment.id);
    } catch (error: any) {
      console.warn("[Booking] Confirmation failed", error);
      Alert.alert(
        "Confirmation failed",
        error?.message ?? "Unable to confirm appointment"
      );
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

  const disabled = submitting || polling || !name || !phone;

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
        style={[styles.input, nameLocked && styles.lockedInput]}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        accessibilityLabel="Full name"
        editable={!nameLocked}
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
        style={[styles.input, emailLocked && styles.lockedInput]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email"
        editable={!emailLocked}
      />
      <TouchableOpacity
        style={[styles.primaryButton, disabled && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={disabled}
        accessibilityRole="button"
      >
        {submitting || polling ? (
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
  lockedInput: {
  backgroundColor: "#f3f4f6",
  color: "#111827",
  opacity: 0.9,
},

});
